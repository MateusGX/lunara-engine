import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CartridgeRunner } from "../cartridge-runner";
import type { RunnerCallbacks } from "../cartridge-runner";
import type { Cartridge } from "@/types/cartridge";

// ── Shared mock state (hoisted so it's available inside vi.mock factories) ────

const runtimeImpl = vi.hoisted(() => ({
  init:                vi.fn().mockResolvedValue(undefined),
  loadScripts:         vi.fn().mockResolvedValue(undefined),
  callInit:            vi.fn().mockResolvedValue(undefined),
  callUpdate:          vi.fn().mockResolvedValue(undefined),
  callDraw:            vi.fn().mockResolvedValue(undefined),
  resetFrame:          vi.fn(),
  getFrameInstructions: vi.fn().mockReturnValue(0),
  getFrameVramBytes:   vi.fn().mockReturnValue(0),
  getLuaMemBytes:      vi.fn().mockResolvedValue(0),
  dispose:             vi.fn(),
}));

// ── Class mocks (arrow functions are not constructable) ───────────────────────

vi.mock("../canvas-renderer", () => ({
  CanvasRenderer: class { flush() {} resetState() {} },
}));

vi.mock("../input-manager", () => ({
  InputManager: class { tick() {} dispose() {} },
}));

vi.mock("../audio-engine", () => ({
  AudioEngine: class { dispose() {} },
}));

vi.mock("../lua-runtime", () => ({
  LuaRuntime: class {
    init                = runtimeImpl.init;
    loadScripts         = runtimeImpl.loadScripts;
    callInit            = runtimeImpl.callInit;
    callUpdate          = runtimeImpl.callUpdate;
    callDraw            = runtimeImpl.callDraw;
    resetFrame          = runtimeImpl.resetFrame;
    getFrameInstructions = runtimeImpl.getFrameInstructions;
    getFrameVramBytes   = runtimeImpl.getFrameVramBytes;
    getLuaMemBytes      = runtimeImpl.getLuaMemBytes;
    dispose             = runtimeImpl.dispose;
  },
}));

vi.mock("@/cartridge/export", () => ({
  calcStorageBytes: vi.fn().mockReturnValue(0),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCallbacks(): RunnerCallbacks {
  return {
    onPrint: vi.fn(),
    onError: vi.fn(),
    onCrash: vi.fn(),
    onStats:  vi.fn(),
  };
}

function makeCartridge(hwOverrides: Partial<Cartridge["hardware"]> = {}): Cartridge {
  return {
    meta: { id: "test", name: "Test", author: "", description: "", version: "1.0.0", created: 0, updated: 0 },
    hardware: {
      width: 64, height: 64,
      palette: ["#000000", "#ffffff"],
      inputs: [],
      maxSprites: 64, maxSounds: 32,
      maxFps: 30, maxIps: 2_000_000,
      // 256 KB — well above the 64×64×4 = 16 KB framebuffer
      maxMemBytes: 256 * 1024,
      maxStorageBytes: 128 * 1024,
      spriteSize: 8,
      sfxSteps: 32,
      ...hwOverrides,
    },
    scripts: [{ id: 0, name: "main", code: "" }],
    sprites: [], maps: [], sounds: [],
  };
}

function makeCanvas(): HTMLCanvasElement {
  return {
    getContext: vi.fn(() => ({
      imageSmoothingEnabled: false,
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(64 * 64 * 4) })),
      putImageData: vi.fn(),
    })),
    width: 0, height: 0,
  } as unknown as HTMLCanvasElement;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CartridgeRunner", () => {
  let callbacks: RunnerCallbacks;
  let runner: CartridgeRunner;

  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", vi.fn().mockReturnValue(1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    // Reset all runtime method mocks to default (passing) state
    runtimeImpl.init.mockResolvedValue(undefined);
    runtimeImpl.loadScripts.mockResolvedValue(undefined);
    runtimeImpl.callInit.mockResolvedValue(undefined);
    runtimeImpl.getFrameInstructions.mockReturnValue(0);
    runtimeImpl.getFrameVramBytes.mockReturnValue(0);
    runtimeImpl.getLuaMemBytes.mockResolvedValue(0);
    callbacks = makeCallbacks();
    runner = new CartridgeRunner(callbacks);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("running state", () => {
    it("starts as not running", () => {
      expect(runner.running).toBe(false);
    });

    it("is running after a successful start()", async () => {
      await runner.start(makeCartridge(), makeCanvas());
      expect(runner.running).toBe(true);
    });

    it("is not running after stop()", async () => {
      await runner.start(makeCartridge(), makeCanvas());
      runner.stop();
      expect(runner.running).toBe(false);
    });

    it("stop() is safe to call when already stopped", () => {
      expect(() => runner.stop()).not.toThrow();
    });
  });

  describe("hardware config defaults (?? fallbacks)", () => {
    it("uses built-in defaults when hardware limits are absent", async () => {
      // Cast required fields to undefined to simulate an old cartridge format
      const cartridge = makeCartridge({
        maxFps: undefined as unknown as number,
        maxIps: undefined as unknown as number,
        maxMemBytes: undefined as unknown as number,
        maxStorageBytes: undefined as unknown as number,
      });
      await runner.start(cartridge, makeCanvas());
      expect(runner.running).toBe(true);
    });

    it("falls back to spriteSize 8 when spriteSize is absent", async () => {
      const cartridge = makeCartridge({
        spriteSize: undefined as unknown as number,
      });
      await runner.start(cartridge, makeCanvas());
      expect(runner.running).toBe(true);
    });
  });

  describe("storage limit enforcement", () => {
    it("calls onCrash and aborts when storage is over limit", async () => {
      const { calcStorageBytes } = await import("@/cartridge/export");
      // First call = staticMemBytes (must be small), second call = storageUsed (large)
      vi.mocked(calcStorageBytes).mockReturnValueOnce(0).mockReturnValueOnce(999_999);

      await runner.start(makeCartridge({ maxStorageBytes: 1 }), makeCanvas());

      expect(vi.mocked(callbacks.onCrash)).toHaveBeenCalledOnce();
      expect(vi.mocked(callbacks.onCrash).mock.calls[0][0]).toContain("Storage limit exceeded");
      expect(runner.running).toBe(false);
    });
  });

  describe("memory limit enforcement at startup", () => {
    it("calls onCrash when framebuffer alone exceeds maxMemBytes", async () => {
      // 64×64×4 = 16 384 bytes; set limit to 1 to force crash
      await runner.start(makeCartridge({ maxMemBytes: 1 }), makeCanvas());

      expect(vi.mocked(callbacks.onCrash)).toHaveBeenCalledOnce();
      expect(vi.mocked(callbacks.onCrash).mock.calls[0][0]).toContain("Memory limit exceeded");
      expect(runner.running).toBe(false);
    });
  });

  describe("script error handling", () => {
    it("calls onCrash and stops if callInit() throws", async () => {
      runtimeImpl.callInit.mockRejectedValueOnce(new Error("lua error"));

      await runner.start(makeCartridge(), makeCanvas());

      expect(vi.mocked(callbacks.onCrash)).toHaveBeenCalledOnce();
      expect(runner.running).toBe(false);
    });
  });

  describe("stop() called concurrently during start()", () => {
    it("aborts after runtime.init() when stop() is called during init", async () => {
      runtimeImpl.init.mockImplementationOnce(async () => {
        runner.stop(); // sets this.runtime = null while init awaits
      });
      await runner.start(makeCartridge(), makeCanvas());
      expect(runner.running).toBe(false);
    });

    it("aborts after loadScripts() when stop() is called during loadScripts", async () => {
      runtimeImpl.loadScripts.mockImplementationOnce(async () => {
        runner.stop();
      });
      await runner.start(makeCartridge(), makeCanvas());
      expect(runner.running).toBe(false);
    });

    it("aborts after callInit() when stop() is called during callInit", async () => {
      runtimeImpl.callInit.mockImplementationOnce(async () => {
        runner.stop();
      });
      await runner.start(makeCartridge(), makeCanvas());
      expect(runner.running).toBe(false);
    });
  });

  describe("stop()", () => {
    it("cancels the pending animation frame", async () => {
      await runner.start(makeCartridge(), makeCanvas());
      runner.stop();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe("runtime.init() callbacks", () => {
    it("getSprite finds a sprite by id", async () => {
      let capturedOpts: Parameters<typeof runtimeImpl.init>[0] | undefined;
      runtimeImpl.init.mockImplementationOnce(async (opts) => { capturedOpts = opts; });

      const cartridge = makeCartridge();
      cartridge.sprites = [{ id: 3, name: "hero", width: 8, height: 8, pixels: [] }];
      await runner.start(cartridge, makeCanvas());

      expect(capturedOpts!.getSprite(3)).toEqual(expect.objectContaining({ id: 3 }));
      expect(capturedOpts!.getSprite(99)).toBeUndefined();
    });

    it("getTime returns a non-negative number of seconds", async () => {
      let capturedOpts: Parameters<typeof runtimeImpl.init>[0] | undefined;
      runtimeImpl.init.mockImplementationOnce(async (opts) => { capturedOpts = opts; });
      await runner.start(makeCartridge(), makeCanvas());

      expect(capturedOpts!.getTime()).toBeGreaterThanOrEqual(0);
    });

    it("getStats returns cpu and mem fields", async () => {
      let capturedOpts: Parameters<typeof runtimeImpl.init>[0] | undefined;
      runtimeImpl.init.mockImplementationOnce(async (opts) => { capturedOpts = opts; });
      await runner.start(makeCartridge(), makeCanvas());

      const stats = capturedOpts!.getStats();
      expect(stats).toHaveProperty("cpu");
      expect(stats).toHaveProperty("mem");
    });
  });

  describe("loop()", () => {
    // Override RAF to capture callbacks instead of calling them immediately.
    type RafCb = (now: number) => void;
    let rafQueue: RafCb[];

    beforeEach(() => {
      rafQueue = [];
      vi.stubGlobal(
        "requestAnimationFrame",
        vi.fn((cb: RafCb) => { rafQueue.push(cb); return rafQueue.length; }),
      );
      runtimeImpl.callUpdate.mockClear();
      runtimeImpl.callDraw.mockClear();
    });

    async function runOneFrame(now = 1_000_000) {
      const cb = rafQueue.shift();
      if (cb) await cb(now);
    }

    it("executes callUpdate and callDraw each frame", async () => {
      await runner.start(makeCartridge(), makeCanvas());
      await runOneFrame();
      expect(runtimeImpl.callUpdate).toHaveBeenCalled();
      expect(runtimeImpl.callDraw).toHaveBeenCalled();
    });

    it("skips tick and re-schedules when elapsed < frameDuration", async () => {
      await runner.start(makeCartridge({ maxFps: 30 }), makeCanvas());
      await runOneFrame(1); // now=1 → elapsed is deeply negative → < 33ms
      expect(runtimeImpl.callUpdate).not.toHaveBeenCalled();
      expect(rafQueue.length).toBeGreaterThan(0); // next RAF was scheduled
    });

    it("does not tick if _running is false when the RAF fires", async () => {
      await runner.start(makeCartridge(), makeCanvas());
      runner.stop();
      await runOneFrame();
      expect(runtimeImpl.callUpdate).not.toHaveBeenCalled();
    });

    it("calls onCrash and stops when callUpdate throws", async () => {
      runtimeImpl.callUpdate.mockRejectedValueOnce(new Error("update crash"));
      await runner.start(makeCartridge(), makeCanvas());
      await runOneFrame();
      expect(vi.mocked(callbacks.onCrash)).toHaveBeenCalled();
      expect(runner.running).toBe(false);
    });

    it("calls onCrash and stops when callDraw throws", async () => {
      runtimeImpl.callDraw.mockRejectedValueOnce(new Error("draw crash"));
      await runner.start(makeCartridge(), makeCanvas());
      await runOneFrame();
      expect(vi.mocked(callbacks.onCrash)).toHaveBeenCalled();
      expect(runner.running).toBe(false);
    });

    it("calls onStats after each frame", async () => {
      await runner.start(makeCartridge(), makeCanvas());
      await runOneFrame();
      expect(vi.mocked(callbacks.onStats)).toHaveBeenCalled();
    });

    it("calls onCrash when memory limit is exceeded in loop", async () => {
      runtimeImpl.getLuaMemBytes.mockResolvedValue(500 * 1024);
      await runner.start(makeCartridge({ maxMemBytes: 100 * 1024 }), makeCanvas());
      await runOneFrame();
      expect(vi.mocked(callbacks.onCrash)).toHaveBeenCalledWith(
        expect.stringContaining("Memory limit exceeded"),
      );
      expect(runner.running).toBe(false);
    });

    it("emits onError with MIPS label on first over-budget frame", async () => {
      // maxIps=2M, maxFps=30 → budget = 66 666 instr/frame; return 1M to exceed
      runtimeImpl.getFrameInstructions.mockReturnValue(1_000_000);
      await runner.start(makeCartridge({ maxIps: 2_000_000, maxFps: 30 }), makeCanvas());
      await runOneFrame();
      expect(vi.mocked(callbacks.onError)).toHaveBeenCalledWith(
        expect.stringContaining("MIPS"),
      );
    });

    it("emits onError with KIPS label for sub-million IPS budget", async () => {
      runtimeImpl.getFrameInstructions.mockReturnValue(50_000);
      await runner.start(makeCartridge({ maxIps: 500_000, maxFps: 30 }), makeCanvas());
      await runOneFrame();
      expect(vi.mocked(callbacks.onError)).toHaveBeenCalledWith(
        expect.stringContaining("KIPS"),
      );
    });

    it("emits onError with plain IPS label for sub-1000 IPS budget", async () => {
      runtimeImpl.getFrameInstructions.mockReturnValue(500);
      await runner.start(makeCartridge({ maxIps: 100, maxFps: 30 }), makeCanvas());
      await runOneFrame();
      expect(vi.mocked(callbacks.onError)).toHaveBeenCalledWith(
        expect.stringContaining("IPS"),
      );
    });

    it("crashes after 3 consecutive over-budget frames", async () => {
      runtimeImpl.getFrameInstructions.mockReturnValue(1_000_000);
      await runner.start(makeCartridge({ maxIps: 2_000_000, maxFps: 30 }), makeCanvas());

      for (let i = 0; i < 3; i++) {
        await runOneFrame(1_000_000 + i * 200);
      }

      expect(vi.mocked(callbacks.onCrash)).toHaveBeenCalledWith(
        expect.stringContaining("CPU limit exceeded"),
      );
      expect(runner.running).toBe(false);
    });

    it("uses ?? 0 fallbacks when runtime becomes null during callUpdate", async () => {
      runtimeImpl.callUpdate.mockImplementationOnce(async () => {
        runner.stop(); // nullifies this.runtime mid-loop without throwing
      });
      await runner.start(makeCartridge(), makeCanvas());
      // Should complete the frame without crashing, using 0 for all counters
      await runOneFrame();
      expect(vi.mocked(callbacks.onCrash)).not.toHaveBeenCalled();
    });

    it("resets cpuOverCount when frame drops back under budget", async () => {
      runtimeImpl.getFrameInstructions
        .mockReturnValueOnce(1_000_000) // frame 1: over budget
        .mockReturnValue(0);            // subsequent frames: under budget

      await runner.start(makeCartridge({ maxIps: 2_000_000, maxFps: 30 }), makeCanvas());
      await runOneFrame(1_000_000);       // over  → cpuOverCount = 1
      await runOneFrame(1_000_200);       // under → cpuOverCount resets to 0

      // No crash should have occurred
      expect(vi.mocked(callbacks.onCrash)).not.toHaveBeenCalled();
    });

    it("does not emit onError on the 2nd over-budget frame (only on 1st)", async () => {
      runtimeImpl.getFrameInstructions.mockReturnValue(1_000_000);
      await runner.start(makeCartridge({ maxIps: 2_000_000, maxFps: 30 }), makeCanvas());

      await runOneFrame(1_000_000); // cpuOverCount = 1 → onError called once
      vi.mocked(callbacks.onError).mockClear();
      await runOneFrame(1_000_200); // cpuOverCount = 2 → onError NOT called again

      expect(vi.mocked(callbacks.onError)).not.toHaveBeenCalled();
    });
  });
});
