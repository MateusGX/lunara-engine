import { LuaFactory, LuaLibraries } from "wasmoon";
import type { CanvasRenderer } from "./canvas-renderer";
import type { InputManager } from "./input-manager";
import type { AudioEngine } from "./audio-engine";
import type { ScriptData } from "@/types/cartridge";
import { preprocessLua } from "@/editor/lua-preprocessor";
import { type Cost } from "./lua-api-costs";
import {
  type ApiRegistrationContext,
  registerDrawingApi,
  registerInputApi,
  registerSoundApi,
  registerMathApi,
  registerStateApi,
  registerStdlibApi,
} from "./lua-api";

export interface LuaRuntimeOptions {
  renderer: CanvasRenderer;
  input: InputManager;
  audio: AudioEngine;
  onPrint: (msg: string) => void;
  onError: (msg: string) => void;
  getTime: () => number;
  getStats: () => { cpu: number; mem: number };
  getSprite: (id: number) => { width: number; height: number } | undefined;
  screenPixels: number; // width * height — needed for cls() cost
  spriteSize: number;   // sprite width/height in pixels — needed for map() cost
}

export class LuaRuntime {
  private factory: LuaFactory | null = null;
  private engine: Awaited<ReturnType<LuaFactory["createEngine"]>> | null = null;
  private luaMemBaseline = 0; // Lua heap right after init, before user scripts
  private frameVramBytes = 0; // pixels pushed to VRAM this frame via draw calls
  private frameInstructions = 0; // virtual instructions this frame via API calls

  async init(opts: LuaRuntimeOptions): Promise<void> {
    this.factory = new LuaFactory();
    // enableProxy: true lets JS functions receive Lua tables as mutable proxy
    // objects, which is required for table.insert / table.remove / table.sort.
    this.engine = await this.factory.createEngine({
      openStandardLibs: false,
      enableProxy: true,
    });
    const L = this.engine.global;

    const process = (c: Cost) => {
      this.frameInstructions += c.instructions;
      if (c.vram) this.frameVramBytes += c.vram;
    };

    const ctx: ApiRegistrationContext = {
      L,
      process,
      renderer: opts.renderer,
      input: opts.input,
      audio: opts.audio,
      opts,
    };

    registerDrawingApi(ctx);
    registerInputApi(ctx);
    registerSoundApi(ctx);
    registerMathApi(ctx);
    registerStateApi(ctx);
    registerStdlibApi(ctx);

    // ── Package / Debug ───────────────────────────────────────────────────────
    L.loadLibrary(LuaLibraries.Package);
    L.loadLibrary(LuaLibraries.Debug);

    // ── Opcode counter ────────────────────────────────────────────────────────
    // Fires every HOOK_INTERVAL Lua opcodes, accumulating into frameInstructions
    // so that loops and pure-Lua logic are measured alongside API call costs.
    const HOOK_INTERVAL = 100;
    L.set("__lunara_hook", () => {
      this.frameInstructions += HOOK_INTERVAL;
    });
    await this.engine.doString(
      `debug.sethook(__lunara_hook, "", ${HOOK_INTERVAL})`,
    );

    // ── Memory probe ──────────────────────────────────────────────────────────
    // collectgarbage is a stub returning 0, so mem tracking reads 0 bytes.
    await this.engine.doString(`
      function __lunara_mem_bytes() return collectgarbage("count") * 1024 end
    `);

    // ── Print override ────────────────────────────────────────────────────────
    // print(str, x, y, c) → canvas draw; print(str) → console log via onPrint.
    await this.engine.doString(`
      local _canvas_print = print
      print = function(str, x, y, c)
        if x ~= nil then
          _canvas_print(str, x, y, c)
        else
          __lunara_print(tostring(str))
        end
      end
    `);
    L.set("__lunara_print", (msg: string) => opts.onPrint(msg));

    // Capture baseline after all engine setup, before user scripts are loaded.
    // getLuaMemBytes() subtracts this so only user allocations are counted.
    const fn = this.engine.global.get("__lunara_mem_bytes");
    if (typeof fn === "function") this.luaMemBaseline = (await fn()) as number;
  }

  async loadScripts(scripts: ScriptData[]): Promise<void> {
    if (!this.engine) throw new Error("Runtime not initialized");

    // Register every non-main script as a Lua module so require("name") works
    for (const script of scripts) {
      if (script.id === 0) continue;
      await this.engine.doString(
        `package.preload[${JSON.stringify(script.name)}] = function(...)\n${preprocessLua(script.code)}\nend`,
      );
    }

    // Execute the main script (id 0) as the entry point
    const main = scripts.find((s) => s.id === 0) ?? scripts[0];
    if (main) await this.engine.doString(main.code);
  }

  async callInit(): Promise<void> {
    if (!this.engine) return;
    const fn = this.engine.global.get("_init");
    if (typeof fn === "function") await fn();
  }

  async callUpdate(dt: number): Promise<void> {
    if (!this.engine) return;
    const fn = this.engine.global.get("_update");
    if (typeof fn === "function") await fn(dt);
  }

  async callDraw(): Promise<void> {
    if (!this.engine) return;
    const fn = this.engine.global.get("_draw");
    if (typeof fn === "function") await fn();
  }

  resetFrame() {
    this.frameVramBytes = 0;
    this.frameInstructions = 0;
  }
  getFrameVramBytes() {
    return this.frameVramBytes;
  }
  getFrameInstructions() {
    return this.frameInstructions;
  }

  /**
   * Returns bytes allocated by user scripts (current Lua heap minus the engine baseline).
   * Clamped to 0 — can go negative briefly when GC runs between frames.
   */
  async getLuaMemBytes(): Promise<number> {
    if (!this.engine) return 0;
    const fn = this.engine.global.get("__lunara_mem_bytes");
    if (typeof fn === "function") {
      const current = (await fn()) as number;
      return Math.max(0, current - this.luaMemBaseline);
    }
    return 0;
  }

  dispose() {
    this.engine?.global.close();
    this.engine = null;
  }
}
