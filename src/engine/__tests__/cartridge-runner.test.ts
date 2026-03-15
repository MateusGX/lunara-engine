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

vi.mock("@/lib/export-lun", () => ({
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

  describe("storage limit enforcement", () => {
    it("calls onCrash and aborts when storage is over limit", async () => {
      const { calcStorageBytes } = await import("@/lib/export-lun");
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

  describe("stop()", () => {
    it("cancels the pending animation frame", async () => {
      await runner.start(makeCartridge(), makeCanvas());
      runner.stop();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });
});
