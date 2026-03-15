import type { Cartridge } from "@/types/cartridge";
import { calcStorageBytes } from "@/lib/export-lun";
import { CanvasRenderer } from "./canvas-renderer";
import { InputManager } from "./input-manager";
import { AudioEngine } from "./audio-engine";
import { LuaRuntime } from "./lua-runtime";

export interface RunnerCallbacks {
  onPrint: (msg: string) => void;
  onError: (msg: string) => void;
  onCrash: (msg: string) => void;
  onStats: (cpu: number, mem: number) => void;
}

export class CartridgeRunner {
  private renderer: CanvasRenderer | null = null;
  private input: InputManager | null = null;
  private audio: AudioEngine | null = null;
  private runtime: LuaRuntime | null = null;
  private rafHandle: number | null = null;
  private startTime = 0;
  private lastTime = 0;
  onStats: (cpu: number, mem: number) => void;
  private frameInstructions = 0;
  private callbacks: RunnerCallbacks;
  private _running = false;
  private cpuOverCount = 0;
  private maxFps = 60;
  private maxIps = 8_000_000;
  private maxMemBytes = Infinity;
  private staticMemBytes = 0; // asset data computed at load time
  private memEst = 0; // staticMemBytes + live Lua heap, updated each frame

  constructor(callbacks: RunnerCallbacks) {
    this.callbacks = callbacks;
    this.onStats = callbacks.onStats;
  }

  get running() {
    return this._running;
  }

  async start(cartridge: Cartridge, canvas: HTMLCanvasElement): Promise<void> {
    this.stop();

    this.renderer = new CanvasRenderer(
      canvas,
      cartridge.hardware,
      cartridge.sprites,
      cartridge.maps,
    );
    this.input = new InputManager(cartridge.hardware.inputs);
    this.audio = new AudioEngine(cartridge.sounds);
    this.runtime = new LuaRuntime();
    this.startTime = performance.now();
    this.lastTime = this.startTime;

    this.maxFps = cartridge.hardware.maxFps ?? 60;
    this.maxIps = cartridge.hardware.maxIps ?? 8_000_000;
    this.maxMemBytes = cartridge.hardware.maxMemBytes ?? Infinity;
    this.cpuOverCount = 0;

    const hw = cartridge.hardware;
    // framebuffer: RGBA canvas pixel buffer (RAM-only, not counted as storage)
    const framebufferBytes = hw.width * hw.height * 4;

    this.staticMemBytes = framebufferBytes + calcStorageBytes(cartridge);
    this.memEst = this.staticMemBytes;

    const storageUsed = calcStorageBytes(cartridge);
    const storageLimit = cartridge.hardware.maxStorageBytes ?? Infinity;
    if (storageUsed > storageLimit) {
      this.callbacks.onCrash(
        `[hardware] Storage limit exceeded: ${storageUsed.toLocaleString()} bytes used, limit is ${storageLimit.toLocaleString()} bytes`,
      );
      return;
    }

    if (this.memEst > this.maxMemBytes) {
      this.callbacks.onCrash(
        `[hardware] Memory limit exceeded: ${this.memEst} bytes used, limit is ${this.maxMemBytes} bytes`,
      );
      return;
    }

    await this.runtime.init({
      renderer: this.renderer,
      input: this.input,
      audio: this.audio,
      onPrint: this.callbacks.onPrint,
      onError: this.callbacks.onError,
      getSprite: (id) => cartridge.sprites.find((s) => s.id === id),
      screenPixels: cartridge.hardware.width * cartridge.hardware.height,
      getTime: () => (performance.now() - this.startTime) / 1000,
      getStats: () => ({
        cpu: this.frameInstructions,
        mem: this.memEst,
      }),
    });

    // stop() may have been called while init() was awaiting
    if (!this.runtime) return;

    try {
      await this.runtime.loadScripts(cartridge.scripts);
      if (!this.runtime) return;
      await this.runtime.callInit();
      if (!this.runtime) return;
    } catch (err) {
      this.callbacks.onCrash(String(err));
      this.stop();
      return;
    }

    this._running = true;
    this.loop();
  }

  private loop() {
    this.rafHandle = requestAnimationFrame(async (now) => {
      if (!this._running) return;

      // FPS limiter: skip tick if not enough time has elapsed
      const frameDuration = 1000 / this.maxFps;
      const elapsed = now - this.lastTime;
      if (elapsed < frameDuration) {
        this.loop();
        return;
      }

      const dt = Math.min(elapsed / 1000, 0.1); // cap at 100ms
      this.lastTime = now;
      this.runtime?.resetFrame();
      try {
        await this.runtime?.callUpdate(dt);
        await this.runtime?.callDraw();
        this.renderer?.flush();
        this.input?.tick(); // clear justPressed after _update has read it
      } catch (err) {
        this.callbacks.onCrash(String(err));
        this.stop();
        return;
      }
      this.frameInstructions = this.runtime?.getFrameInstructions() ?? 0;

      const luaHeapBytes = (await this.runtime?.getLuaMemBytes()) ?? 0;
      const vramBytes = this.runtime?.getFrameVramBytes() ?? 0;
      this.memEst = this.staticMemBytes + luaHeapBytes + vramBytes;

      if (this.memEst > this.maxMemBytes) {
        this.callbacks.onCrash(
          `[hardware] Memory limit exceeded: ${this.memEst.toLocaleString()} bytes used, limit is ${this.maxMemBytes.toLocaleString()} bytes`,
        );
        this.stop();
        return;
      }

      // Budget: instructions the virtual CPU can execute per frame
      const budgetPerFrame = this.maxIps / this.maxFps;
      const cpuPercent = Math.min(
        200,
        (this.frameInstructions / budgetPerFrame) * 100,
      );
      this.onStats(cpuPercent, this.memEst);

      if (this.frameInstructions > budgetPerFrame) {
        this.cpuOverCount++;
        if (this.cpuOverCount === 1) {
          const ipsLabel =
            this.maxIps >= 1_000_000
              ? `${(this.maxIps / 1_000_000).toFixed(1)} MIPS`
              : this.maxIps >= 1_000
                ? `${(this.maxIps / 1_000).toFixed(1)} KIPS`
                : `${this.maxIps} IPS`;
          this.callbacks.onError(
            `[hardware] CPU limit warning: ${this.frameInstructions.toLocaleString()} instructions in frame, budget for ${ipsLabel} is ${Math.floor(budgetPerFrame).toLocaleString()} instr/frame`,
          );
        }
        if (this.cpuOverCount >= 3) {
          this.callbacks.onCrash(
            `[hardware] CPU limit exceeded for 3 frames — game stopped`,
          );
          this.stop();
          return;
        }
      } else {
        this.cpuOverCount = 0;
      }

      this.loop();
    });
  }

  stop() {
    this._running = false;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.runtime?.dispose();
    this.input?.dispose();
    this.audio?.dispose();
    this.renderer = null;
    this.input = null;
    this.audio = null;
    this.runtime = null;
  }
}
