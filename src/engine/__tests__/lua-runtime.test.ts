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

    it("callUpdate() does nothing when _update is not defined", async () => {
      mocks.store.delete("_update");
      await expect(runtime.callUpdate(0.016)).resolves.toBeUndefined();
    });

    it("callDraw() does nothing when _draw is not defined", async () => {
      mocks.store.delete("_draw");
      await expect(runtime.callDraw()).resolves.toBeUndefined();
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

  describe("remaining drawing API — VRAM and instructions", () => {
    it("line() increments VRAM and instructions by pixel length + overhead", () => {
      runtime.resetFrame();
      (mocks.store.get("line") as (x0: number, y0: number, x1: number, y1: number, col: number) => void)(0, 0, 3, 0, 1);
      // px = max(|3-0|, |0-0|) + 1 = 4
      expect(runtime.getFrameVramBytes()).toBe(4);
      expect(runtime.getFrameInstructions()).toBe(4 + 8);
    });

    it("rect() increments VRAM by 2*(w+h)", () => {
      runtime.resetFrame();
      (mocks.store.get("rect") as (x: number, y: number, w: number, h: number, col: number) => void)(0, 0, 4, 6, 1);
      // px = 2*(4+6) = 20
      expect(runtime.getFrameVramBytes()).toBe(20);
      expect(runtime.getFrameInstructions()).toBe(20 + 8);
    });

    it("circ() increments VRAM by ceil(2πr)", () => {
      runtime.resetFrame();
      (mocks.store.get("circ") as (x: number, y: number, rad: number, col: number) => void)(0, 0, 5, 1);
      const px = Math.ceil(2 * Math.PI * 5);
      expect(runtime.getFrameVramBytes()).toBe(px);
      expect(runtime.getFrameInstructions()).toBe(px + 10);
    });

    it("circfill() increments VRAM by ceil(πr²)", () => {
      runtime.resetFrame();
      (mocks.store.get("circfill") as (x: number, y: number, rad: number, col: number) => void)(0, 0, 4, 1);
      const px = Math.ceil(Math.PI * 4 * 4);
      expect(runtime.getFrameVramBytes()).toBe(px);
      expect(runtime.getFrameInstructions()).toBe(px + 10);
    });

    it("map() increments VRAM by tw*th*64", () => {
      runtime.resetFrame();
      (mocks.store.get("map") as (tx: number, ty: number, sx: number, sy: number, tw: number, th: number) => void)(0, 0, 0, 0, 3, 2);
      // px = 3*2*64 = 384
      expect(runtime.getFrameVramBytes()).toBe(384);
      expect(runtime.getFrameInstructions()).toBe(384 + 30);
    });

    it("print() increments VRAM by str.length * CHAR_W * CHAR_H", () => {
      runtime.resetFrame();
      (mocks.store.get("print") as (str: unknown, x: number, y: number, col: number) => void)("hi", 0, 0, 1);
      // "hi" = 2 chars, 5*7 = 35 px each → 70
      expect(runtime.getFrameVramBytes()).toBe(70);
    });

    it("cursor() increments instructions by 2", () => {
      runtime.resetFrame();
      (mocks.store.get("cursor") as (x: number, y: number) => void)(0, 0);
      expect(runtime.getFrameInstructions()).toBe(2);
    });

    it("pget() increments instructions by 2 and returns renderer result", () => {
      runtime.resetFrame();
      const result = (mocks.store.get("pget") as (x: number, y: number) => number)(0, 0);
      expect(runtime.getFrameInstructions()).toBe(2);
      expect(result).toBe(0);
    });

    it("spr() does not increment VRAM when sprite is undefined", () => {
      vi.mocked(opts.getSprite).mockReturnValueOnce(undefined);
      runtime.resetFrame();
      (mocks.store.get("spr") as (n: number, x: number, y: number) => void)(99, 0, 0);
      expect(runtime.getFrameVramBytes()).toBe(0);
    });
  });

  describe("remaining input/sound/state API", () => {
    it("btnp() increments instructions by 2", () => {
      runtime.resetFrame();
      (mocks.store.get("btnp") as (idx: number) => boolean)(0);
      expect(runtime.getFrameInstructions()).toBe(2);
    });

    it("music() increments instructions by 50", () => {
      runtime.resetFrame();
      (mocks.store.get("music") as (n: number) => void)(0);
      expect(runtime.getFrameInstructions()).toBe(50);
    });

    it("time() increments instructions by 2", () => {
      runtime.resetFrame();
      (mocks.store.get("time") as () => number)();
      expect(runtime.getFrameInstructions()).toBe(2);
    });

    it("stat() returns cpu when idx=0", () => {
      const fn = mocks.store.get("stat") as (idx: number) => number;
      expect(fn(0)).toBe(0); // getStats returns { cpu: 0, mem: 0 }
    });

    it("stat() returns mem when idx=1", () => {
      const fn = mocks.store.get("stat") as (idx: number) => number;
      expect(fn(1)).toBe(0);
    });

    it("stat() returns 0 for unknown index", () => {
      const fn = mocks.store.get("stat") as (idx: number) => number;
      expect(fn(99)).toBe(0);
    });

    it("camera() increments instructions by 4", () => {
      runtime.resetFrame();
      (mocks.store.get("camera") as (x: number, y: number) => void)(0, 0);
      expect(runtime.getFrameInstructions()).toBe(4);
    });

    it("pal() increments instructions by 4", () => {
      runtime.resetFrame();
      (mocks.store.get("pal") as (c0: number, c1: number) => void)(0, 1);
      expect(runtime.getFrameInstructions()).toBe(4);
    });

    it("palt() increments instructions by 4", () => {
      runtime.resetFrame();
      (mocks.store.get("palt") as (ct: number, t: boolean) => void)(0, true);
      expect(runtime.getFrameInstructions()).toBe(4);
    });
  });

  describe("remaining math API", () => {
    it("flr() returns Math.floor result", () => {
      const fn = mocks.store.get("flr") as (n: number) => number;
      expect(fn(3.7)).toBe(3);
    });

    it("ceil() returns Math.ceil result", () => {
      const fn = mocks.store.get("ceil") as (n: number) => number;
      expect(fn(3.2)).toBe(4);
    });

    it("abs() returns Math.abs result", () => {
      const fn = mocks.store.get("abs") as (n: number) => number;
      expect(fn(-5)).toBe(5);
    });

    it("min() returns the smaller value", () => {
      const fn = mocks.store.get("min") as (a: number, b: number) => number;
      expect(fn(3, 7)).toBe(3);
    });

    it("max() returns the larger value", () => {
      const fn = mocks.store.get("max") as (a: number, b: number) => number;
      expect(fn(3, 7)).toBe(7);
    });

    it("mid() returns the median of three numbers", () => {
      const fn = mocks.store.get("mid") as (a: number, b: number, c: number) => number;
      expect(fn(1, 5, 3)).toBe(3);
    });

    it("cos() returns Math.cos result", () => {
      const fn = mocks.store.get("cos") as (a: number) => number;
      expect(fn(0)).toBeCloseTo(1);
    });

    it("atan2() returns Math.atan2 result", () => {
      const fn = mocks.store.get("atan2") as (y: number, x: number) => number;
      expect(fn(0, 1)).toBeCloseTo(0);
    });

    it("sqrt() returns Math.sqrt result", () => {
      const fn = mocks.store.get("sqrt") as (n: number) => number;
      expect(fn(9)).toBeCloseTo(3);
    });
  });

  describe("init() baseline capture", () => {
    it("skips baseline when __lunara_mem_bytes is absent from global", async () => {
      // Make the store return undefined for __lunara_mem_bytes so init() hits
      // the false branch of `if (typeof fn === "function")`.
      vi.spyOn(mocks.store, "get").mockImplementation((key: string) => {
        if (key === "__lunara_mem_bytes") return undefined;
        return Map.prototype.get.call(mocks.store, key) as unknown;
      });
      const noBaselineRuntime = new LuaRuntime();
      await expect(noBaselineRuntime.init(makeOpts())).resolves.toBeUndefined();
      vi.restoreAllMocks();
      noBaselineRuntime.dispose();
    });
  });

  describe("getLuaMemBytes() edge cases", () => {
    it("returns 0 when __lunara_mem_bytes is not a function", async () => {
      mocks.store.set("__lunara_mem_bytes", "not-a-function");
      const bytes = await runtime.getLuaMemBytes();
      expect(bytes).toBe(0);
    });
  });

  describe("loadScripts() error path", () => {
    it("throws when engine is not initialized", async () => {
      const uninitRuntime = new LuaRuntime();
      await expect(uninitRuntime.loadScripts([])).rejects.toThrow("Runtime not initialized");
    });

    it("uses first script as main when no script has id 0", async () => {
      await runtime.loadScripts([{ id: 5, name: "fallback", code: "x = 42" }]);
      expect(mocks.doStringCalls.some((c) => c.includes("x = 42"))).toBe(true);
    });
  });

  describe("callInit() / callUpdate() / callDraw() after dispose", () => {
    it("callInit() does nothing after dispose()", async () => {
      runtime.dispose();
      await expect(runtime.callInit()).resolves.toBeUndefined();
    });

    it("callUpdate() does nothing after dispose()", async () => {
      runtime.dispose();
      await expect(runtime.callUpdate(0.016)).resolves.toBeUndefined();
    });

    it("callDraw() does nothing after dispose()", async () => {
      runtime.dispose();
      await expect(runtime.callDraw()).resolves.toBeUndefined();
    });
  });
});
