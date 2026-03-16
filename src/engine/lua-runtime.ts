import { LuaFactory } from "wasmoon";
import type { CanvasRenderer } from "./canvas-renderer";
import type { InputManager } from "./input-manager";
import type { AudioEngine } from "./audio-engine";
import type { ScriptData } from "@/types/cartridge";
import { preprocessLua } from "@/lib/preprocess-lua";

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
}

export class LuaRuntime {
  private factory: LuaFactory | null = null;
  private engine: Awaited<ReturnType<LuaFactory["createEngine"]>> | null = null;
  private luaMemBaseline = 0; // Lua heap right after init, before user scripts
  private frameVramBytes = 0; // pixels pushed to VRAM this frame via draw calls
  private frameInstructions = 0; // virtual instructions this frame via API calls

  async init(opts: LuaRuntimeOptions): Promise<void> {
    this.factory = new LuaFactory();
    this.engine = await this.factory.createEngine({ openStandardLibs: true });
    const L = this.engine.global;

    const r = opts.renderer;
    const i = opts.input;
    const a = opts.audio;

    const CHAR_W = 5, CHAR_H = 7;
    const v = (px: number) => { this.frameVramBytes     += px; };
    const c = (n:  number) => { this.frameInstructions  += n;  };

    // Drawing API
    // vram  (v) = pixels written to the framebuffer
    // instr (c) = per-call overhead + pixel work (setup + fill loop)
    L.set("cls", (col = 0) => {
      v(opts.screenPixels); c(opts.screenPixels + 10);
      r.cls(col);
    });
    L.set("pset", (x: number, y: number, col: number) => {
      v(1); c(4);
      r.pset(x, y, col);
    });
    L.set("pget", (x: number, y: number) => {
      c(2);
      return r.pget(x, y);
    });
    L.set("line", (x0: number, y0: number, x1: number, y1: number, col: number) => {
      const px = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1;
      v(px); c(px + 8);
      r.line(x0, y0, x1, y1, col);
    });
    L.set("rect", (x: number, y: number, w: number, h: number, col: number) => {
      const px = 2 * (w + h);
      v(px); c(px + 8);
      r.rect(x, y, w, h, col);
    });
    L.set("rectfill", (x: number, y: number, w: number, h: number, col: number) => {
      const px = w * h;
      v(px); c(px + 8);
      r.rectfill(x, y, w, h, col);
    });
    L.set("circ", (x: number, y: number, rad: number, col: number) => {
      const px = Math.ceil(2 * Math.PI * rad);
      v(px); c(px + 10);
      r.circ(x, y, rad, col);
    });
    L.set("circfill", (x: number, y: number, rad: number, col: number) => {
      const px = Math.ceil(Math.PI * rad * rad);
      v(px); c(px + 10);
      r.circfill(x, y, rad, col);
    });
    L.set("spr", (n: number, x: number, y: number, sw = 1, sh = 1) => {
      const s = opts.getSprite(n);
      if (s) { const px = s.width * s.height * sw * sh; v(px); c(px + 20); }
      r.spr(n, x, y, sw, sh);
    });
    L.set("map", (tx: number, ty: number, sx: number, sy: number, tw: number, th: number, mapId = 0) => {
      const px = tw * th * 64;
      v(px); c(px + 30);
      r.map(tx, ty, sx, sy, tw, th, mapId);
    });

    // Text API
    L.set("print", (str: unknown, x: number, y: number, col: number) => {
      const s = String(str);
      const px = s.length * CHAR_W * CHAR_H;
      v(px); c(px + s.length * 3 + 8);
      r.print(s, x, y, col);
    });
    L.set("cursor", (x: number, y: number) => { c(2); r.cursor(x, y); });

    // Input API
    L.set("btn",  (idx: number) => { c(2);  return i.btn(idx); });
    L.set("btnp", (idx: number) => { c(2);  return i.btnp(idx); });

    // Sound API
    L.set("sfx",   (n: number) => { c(50); a.sfx(n); });
    L.set("music", (n: number) => { c(50); a.music(n); });

    // Math API — cheap (2-4), transcendental more expensive (15)
    L.set("rnd",   (n = 1)                => { c(4);  return Math.random() * n; });
    L.set("flr",   (n: number)            => { c(2);  return Math.floor(n); });
    L.set("ceil",  (n: number)            => { c(2);  return Math.ceil(n); });
    L.set("abs",   (n: number)            => { c(2);  return Math.abs(n); });
    L.set("min",   (a: number, b: number) => { c(2);  return Math.min(a, b); });
    L.set("max",   (a: number, b: number) => { c(2);  return Math.max(a, b); });
    L.set("mid",   (a: number, b: number, cc: number) => {
      c(4); return [a, b, cc].sort((x, y) => x - y)[1];
    });
    L.set("sin",   (a: number)            => { c(15); return Math.sin(a); });
    L.set("cos",   (a: number)            => { c(15); return Math.cos(a); });
    L.set("atan2", (y: number, x: number) => { c(15); return Math.atan2(y, x); });
    L.set("sqrt",  (n: number)            => { c(10); return Math.sqrt(n); });

    // State API
    L.set("time", () => { c(2); return opts.getTime(); });
    L.set("stat", (idx: number) => {
      c(2);
      const s = opts.getStats();
      if (idx === 0) return s.cpu;
      if (idx === 1) return s.mem;
      return 0;
    });
    L.set("camera", (x: number, y: number)   => { c(4); r.camera(x, y); });
    L.set("pal",    (c0: number, c1: number)  => { c(4); r.pal(c0, c1); });
    L.set("palt",   (ct: number, t: boolean)  => { c(4); r.palt(ct, t); });

    // Debug hook — counts raw Lua VM instructions (captures loops, arithmetic, etc.)
    // Fires every 100 bytecode instructions; each invocation adds 100 to the frame budget.
    L.set("__lunara_count_instr", (n: number) => { this.frameInstructions += n; });
    await this.engine.doString(`
      debug.sethook(function() __lunara_count_instr(100) end, "", 100)
    `);

    // Memory probe — measured each frame via pre-defined global (avoids doString in loop).
    await this.engine.doString(`
      function __lunara_mem_bytes() return math.ceil(collectgarbage("count") * 1024) end
    `);

    // Override print: draw to canvas when x/y/c args given; log to console otherwise
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

  resetFrame() { this.frameVramBytes = 0; this.frameInstructions = 0; }
  getFrameVramBytes() { return this.frameVramBytes; }
  getFrameInstructions() { return this.frameInstructions; }

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
