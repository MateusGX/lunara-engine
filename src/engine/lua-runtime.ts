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
}

export class LuaRuntime {
  private factory: LuaFactory | null = null;
  private engine: Awaited<ReturnType<LuaFactory["createEngine"]>> | null = null;

  async init(opts: LuaRuntimeOptions): Promise<void> {
    this.factory = new LuaFactory();
    this.engine = await this.factory.createEngine({ openStandardLibs: true });
    const L = this.engine.global;

    const r = opts.renderer;
    const i = opts.input;
    const a = opts.audio;

    // Drawing API
    L.set("cls", (c = 0) => r.cls(c));
    L.set("pset", (x: number, y: number, c: number) => r.pset(x, y, c));
    L.set("pget", (x: number, y: number) => r.pget(x, y));
    L.set("line", (x0: number, y0: number, x1: number, y1: number, c: number) => r.line(x0, y0, x1, y1, c));
    L.set("rect", (x: number, y: number, w: number, h: number, c: number) => r.rect(x, y, w, h, c));
    L.set("rectfill", (x: number, y: number, w: number, h: number, c: number) => r.rectfill(x, y, w, h, c));
    L.set("circ", (x: number, y: number, rad: number, c: number) => r.circ(x, y, rad, c));
    L.set("circfill", (x: number, y: number, rad: number, c: number) => r.circfill(x, y, rad, c));
    L.set("spr", (n: number, x: number, y: number, sw = 1, sh = 1) => r.spr(n, x, y, sw, sh));
    L.set("map", (tx: number, ty: number, sx: number, sy: number, tw: number, th: number, mapId = 0) => r.map(tx, ty, sx, sy, tw, th, mapId));

    // Text API
    L.set("print", (str: unknown, x: number, y: number, c: number) => r.print(String(str), x, y, c));
    L.set("cursor", (x: number, y: number) => r.cursor(x, y));

    // Input API
    L.set("btn", (idx: number) => i.btn(idx));
    L.set("btnp", (idx: number) => i.btnp(idx));

    // Sound API
    L.set("sfx", (n: number) => a.sfx(n));
    L.set("music", (n: number) => a.music(n));

    // Math API
    L.set("rnd", (n = 1) => Math.random() * n);
    L.set("flr", (n: number) => Math.floor(n));
    L.set("ceil", (n: number) => Math.ceil(n));
    L.set("abs", (n: number) => Math.abs(n));
    L.set("min", (a: number, b: number) => Math.min(a, b));
    L.set("max", (a: number, b: number) => Math.max(a, b));
    L.set("mid", (a: number, b: number, c: number) => {
      const arr = [a, b, c].sort((x, y) => x - y);
      return arr[1];
    });
    L.set("sin", (a: number) => Math.sin(a));
    L.set("cos", (a: number) => Math.cos(a));
    L.set("atan2", (y: number, x: number) => Math.atan2(y, x));
    L.set("sqrt", (n: number) => Math.sqrt(n));

    // State API
    L.set("time", () => opts.getTime());
    L.set("stat", (idx: number) => {
      const s = opts.getStats();
      if (idx === 0) return s.cpu;
      if (idx === 1) return s.mem;
      return 0;
    });
    L.set("camera", (x: number, y: number) => r.camera(x, y));
    L.set("pal", (c0: number, c1: number) => r.pal(c0, c1));
    L.set("palt", (c: number, t: boolean) => r.palt(c, t));

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

  dispose() {
    this.engine?.global.close();
    this.engine = null;
  }
}
