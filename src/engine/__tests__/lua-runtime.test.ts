import { describe, it, expect, beforeEach, vi } from "vitest";
import { LuaRuntime } from "../lua-runtime";
import type { LuaRuntimeOptions } from "../lua-runtime";

// ── wasmoon mock ─────────────────────────────────────────────────────────────
// vi.hoisted runs before imports, so the store is available inside vi.mock.
const mocks = vi.hoisted(() => ({
  store: new Map<string, unknown>(),
  doStringCalls: [] as string[],
  closeFn: vi.fn(),
}));

vi.mock("wasmoon", () => ({
  LuaFactory: class {
    async createEngine() {
      mocks.store.clear();
      mocks.doStringCalls.length = 0;
      mocks.closeFn.mockReset();
      return {
        global: {
          set(k: string, v: unknown) { mocks.store.set(k, v); },
          get(k: string) { return mocks.store.get(k); },
          close: mocks.closeFn,
        },
        async doString(code: string) {
          mocks.doStringCalls.push(code);
          // Simulate Lua defining __lunara_mem_bytes so baseline capture works
          if (/function __lunara_mem_bytes/.test(code)) {
            mocks.store.set("__lunara_mem_bytes", async () => 4096);
          }
        },
      };
    }
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const SCREEN_PIXELS = 32 * 32;

function makeOpts(): LuaRuntimeOptions {
  return {
    renderer: {
      cls: vi.fn(), pset: vi.fn(), pget: vi.fn(() => 0),
      line: vi.fn(), rect: vi.fn(), rectfill: vi.fn(),
      circ: vi.fn(), circfill: vi.fn(), spr: vi.fn(), map: vi.fn(),
      print: vi.fn(), cursor: vi.fn(), camera: vi.fn(),
      pal: vi.fn(), palt: vi.fn(),
    } as unknown as LuaRuntimeOptions["renderer"],
    input: { btn: vi.fn(() => false), btnp: vi.fn(() => false) } as unknown as LuaRuntimeOptions["input"],
    audio: { sfx: vi.fn(), music: vi.fn() } as unknown as LuaRuntimeOptions["audio"],
    onPrint: vi.fn(),
    onError: vi.fn(),
    getSprite: vi.fn(() => ({ width: 8, height: 8 })),
    screenPixels: SCREEN_PIXELS,
    getTime: () => 0,
    getStats: () => ({ cpu: 0, mem: 0 }),
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("LuaRuntime", () => {
  let runtime: LuaRuntime;
  let opts: LuaRuntimeOptions;

  beforeEach(async () => {
    runtime = new LuaRuntime();
    opts = makeOpts();
    await runtime.init(opts);
    // Reset call tracking after init so tests only see their own interactions
    mocks.doStringCalls.length = 0;
  });

  describe("init()", () => {
    it("registers core drawing API globals", () => {
      for (const name of ["cls", "pset", "pget", "line", "rect", "rectfill",
                          "circ", "circfill", "spr", "map", "print", "cursor"]) {
        expect(typeof mocks.store.get(name)).toBe("function");
      }
    });

    it("registers input API globals", () => {
      expect(typeof mocks.store.get("btn")).toBe("function");
      expect(typeof mocks.store.get("btnp")).toBe("function");
    });

    it("registers math API globals", () => {
      for (const name of ["rnd", "flr", "ceil", "abs", "min", "max", "mid", "sin", "cos", "atan2", "sqrt"]) {
        expect(typeof mocks.store.get(name)).toBe("function");
      }
    });

    it("registers sound API globals", () => {
      expect(typeof mocks.store.get("sfx")).toBe("function");
      expect(typeof mocks.store.get("music")).toBe("function");
    });

    it("registers state API globals", () => {
      expect(typeof mocks.store.get("time")).toBe("function");
      expect(typeof mocks.store.get("stat")).toBe("function");
      expect(typeof mocks.store.get("camera")).toBe("function");
      expect(typeof mocks.store.get("pal")).toBe("function");
      expect(typeof mocks.store.get("palt")).toBe("function");
    });
  });

  describe("VRAM counter", () => {
    it("cls() increments VRAM by screenPixels", () => {
      runtime.resetFrame();
      (mocks.store.get("cls") as () => void)();
      expect(runtime.getFrameVramBytes()).toBe(SCREEN_PIXELS);
    });

    it("pset() increments VRAM by 1", () => {
      runtime.resetFrame();
      (mocks.store.get("pset") as (x: number, y: number, c: number) => void)(0, 0, 1);
      expect(runtime.getFrameVramBytes()).toBe(1);
    });

    it("rectfill() increments VRAM by w × h", () => {
      runtime.resetFrame();
      (mocks.store.get("rectfill") as (x: number, y: number, w: number, h: number, c: number) => void)(0, 0, 4, 4, 1);
      expect(runtime.getFrameVramBytes()).toBe(16);
    });

    it("spr() increments VRAM by sprite area when sprite exists", () => {
      runtime.resetFrame();
      // getSprite returns { width: 8, height: 8 } → 8×8 = 64 pixels
      (mocks.store.get("spr") as (n: number, x: number, y: number) => void)(0, 0, 0);
      expect(runtime.getFrameVramBytes()).toBe(64);
    });

    it("btn() does NOT increment VRAM (input-only)", () => {
      runtime.resetFrame();
      (mocks.store.get("btn") as (idx: number) => boolean)(0);
      expect(runtime.getFrameVramBytes()).toBe(0);
    });
  });

  describe("instruction counter", () => {
    it("pset() increments instructions by 4", () => {
      runtime.resetFrame();
      (mocks.store.get("pset") as (x: number, y: number, c: number) => void)(0, 0, 1);
      expect(runtime.getFrameInstructions()).toBe(4);
    });

    it("btn() increments instructions by 2", () => {
      runtime.resetFrame();
      (mocks.store.get("btn") as (idx: number) => boolean)(0);
      expect(runtime.getFrameInstructions()).toBe(2);
    });

    it("sfx() increments instructions by 50", () => {
      runtime.resetFrame();
      (mocks.store.get("sfx") as (n: number) => void)(0);
      expect(runtime.getFrameInstructions()).toBe(50);
    });

    it("sin() increments instructions by 15", () => {
      runtime.resetFrame();
      (mocks.store.get("sin") as (a: number) => number)(0);
      expect(runtime.getFrameInstructions()).toBe(15);
    });

    it("rnd() increments instructions by 4", () => {
      runtime.resetFrame();
      (mocks.store.get("rnd") as () => number)();
      expect(runtime.getFrameInstructions()).toBe(4);
    });

    it("multiple calls accumulate", () => {
      runtime.resetFrame();
      (mocks.store.get("btn") as (n: number) => boolean)(0); // +2
      (mocks.store.get("btn") as (n: number) => boolean)(1); // +2
      (mocks.store.get("pset") as (x: number, y: number, c: number) => void)(0, 0, 1); // +4
      expect(runtime.getFrameInstructions()).toBe(8);
    });
  });

  describe("resetFrame()", () => {
    it("clears VRAM counter to 0", () => {
      (mocks.store.get("cls") as () => void)();
      runtime.resetFrame();
      expect(runtime.getFrameVramBytes()).toBe(0);
    });

    it("clears instruction counter to 0", () => {
      (mocks.store.get("pset") as (x: number, y: number, c: number) => void)(0, 0, 1);
      runtime.resetFrame();
      expect(runtime.getFrameInstructions()).toBe(0);
    });
  });

  describe("getLuaMemBytes()", () => {
    it("returns 0 when current usage equals baseline", async () => {
      // Baseline was captured as 4096 at init; current also returns 4096
      const bytes = await runtime.getLuaMemBytes();
      expect(bytes).toBe(0);
    });

    it("returns the delta above baseline", async () => {
      // Simulate heap growing above baseline
      mocks.store.set("__lunara_mem_bytes", async () => 8192);
      const bytes = await runtime.getLuaMemBytes();
      expect(bytes).toBe(4096); // 8192 - 4096 baseline
    });

    it("clamps to 0 when current is below baseline (GC ran)", async () => {
      mocks.store.set("__lunara_mem_bytes", async () => 1024);
      const bytes = await runtime.getLuaMemBytes();
      expect(bytes).toBe(0);
    });

    it("returns 0 after dispose()", async () => {
      runtime.dispose();
      const bytes = await runtime.getLuaMemBytes();
      expect(bytes).toBe(0);
    });
  });

  describe("loadScripts()", () => {
    it("registers non-main scripts as package.preload via doString", async () => {
      await runtime.loadScripts([
        { id: 0, name: "main", code: "-- main" },
        { id: 1, name: "utils", code: "-- utils" },
      ]);
      const preloadCall = mocks.doStringCalls.find((c) => c.includes("package.preload") && c.includes("utils"));
      expect(preloadCall).toBeDefined();
    });

    it("executes the main script (id 0) via doString", async () => {
      await runtime.loadScripts([{ id: 0, name: "main", code: "x = 1" }]);
      expect(mocks.doStringCalls.some((c) => c.includes("x = 1"))).toBe(true);
    });

    it("does not register the main script as package.preload", async () => {
      await runtime.loadScripts([{ id: 0, name: "main", code: "-- main" }]);
      expect(mocks.doStringCalls.some((c) => c.includes("package.preload") && c.includes("main"))).toBe(false);
    });
  });

  describe("callInit() / callUpdate() / callDraw()", () => {
    it("callInit() calls the registered _init function", async () => {
      const fn = vi.fn().mockResolvedValue(undefined);
      mocks.store.set("_init", fn);
      await runtime.callInit();
      expect(fn).toHaveBeenCalledOnce();
    });

    it("callUpdate() calls _update with dt", async () => {
      const fn = vi.fn().mockResolvedValue(undefined);
      mocks.store.set("_update", fn);
      await runtime.callUpdate(0.016);
      expect(fn).toHaveBeenCalledWith(0.016);
    });

    it("callDraw() calls _draw", async () => {
      const fn = vi.fn().mockResolvedValue(undefined);
      mocks.store.set("_draw", fn);
      await runtime.callDraw();
      expect(fn).toHaveBeenCalledOnce();
    });

    it("callInit() does nothing when _init is not defined", async () => {
      mocks.store.delete("_init");
      await expect(runtime.callInit()).resolves.toBeUndefined();
    });
  });

  describe("dispose()", () => {
    it("calls engine.global.close()", () => {
      runtime.dispose();
      expect(mocks.closeFn).toHaveBeenCalledOnce();
    });

    it("calling dispose() twice does not throw", () => {
      runtime.dispose();
      expect(() => runtime.dispose()).not.toThrow();
    });
  });
});
