import type { Cartridge } from "@/types/cartridge";
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
  private frameCpuMs = 0;
  private callbacks: RunnerCallbacks;
  private _running = false;
  private cpuOverCount = 0;
  private maxCpuHz = 8_000_000;
  private maxMemBytes = Infinity;
  private memEst = 0;

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
      cartridge.maps
    );
    this.input = new InputManager(cartridge.hardware.inputs);
    this.audio = new AudioEngine(cartridge.sounds);
    this.runtime = new LuaRuntime();
    this.startTime = performance.now();
    this.lastTime = this.startTime;

    this.maxCpuHz = cartridge.hardware.maxCpuHz ?? 8_000_000;
    this.maxMemBytes = cartridge.hardware.maxMemBytes ?? Infinity;
    this.cpuOverCount = 0;

    this.memEst =
      cartridge.sprites.reduce((s: number, sp) => s + sp.pixels.length, 0) +
      cartridge.maps.reduce((s: number, m) => s + m.tiles.length * 2, 0) +
      cartridge.scripts.reduce((s: number, sc) => s + sc.code.length, 0);

    if (this.memEst > this.maxMemBytes) {
      this.callbacks.onCrash(
        `[hardware] Memory limit exceeded: ${this.memEst} bytes used, limit is ${this.maxMemBytes} bytes`
      );
      return;
    }

    await this.runtime.init({
      renderer: this.renderer,
      input: this.input,
      audio: this.audio,
      onPrint: this.callbacks.onPrint,
      onError: this.callbacks.onError,
      getTime: () => (performance.now() - this.startTime) / 1000,
      getStats: () => ({
        cpu: this.frameCpuMs,
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
      const dt = Math.min((now - this.lastTime) / 1000, 0.1); // cap at 100ms
      this.lastTime = now;
      const frameStart = performance.now();
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
      this.frameCpuMs = performance.now() - frameStart;
      // Budget: 8 MHz reference = full frame time (16.67 ms at 60 fps)
      const REF_HZ = 8_000_000;
      const frameBudgetMs = (this.maxCpuHz / REF_HZ) * (1000 / 60);
      const cpuPercent = Math.min(200, (this.frameCpuMs / frameBudgetMs) * 100);
      this.onStats(cpuPercent, this.memEst);

      if (this.frameCpuMs > frameBudgetMs) {
        this.cpuOverCount++;
        if (this.cpuOverCount === 1) {
          const hzLabel = this.maxCpuHz >= 1_000_000
            ? `${(this.maxCpuHz / 1_000_000).toFixed(1)} MHz`
            : this.maxCpuHz >= 1_000
              ? `${(this.maxCpuHz / 1_000).toFixed(1)} KHz`
              : `${this.maxCpuHz} Hz`;
          this.callbacks.onError(
            `[hardware] CPU limit warning: frame took ${this.frameCpuMs.toFixed(1)} ms, budget for ${hzLabel} is ${frameBudgetMs.toFixed(1)} ms`
          );
        }
        if (this.cpuOverCount >= 3) {
          this.callbacks.onCrash(`[hardware] CPU limit exceeded for 3 frames — game stopped`);
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
