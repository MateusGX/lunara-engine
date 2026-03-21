import type { Cost } from "../engine-lua-api";
import type { CanvasRenderer } from "../canvas-renderer";
import type { InputManager } from "../input-manager";
import type { AudioEngine } from "../audio-engine";
import type { LuaRuntimeOptions } from "../lua-runtime";

export interface LuaGlobal {
  set(name: string, value: unknown): void;
  get(name: string): unknown;
}

export interface ApiRegistrationContext {
  L: LuaGlobal;
  process: (cost: Cost) => void;
  renderer: CanvasRenderer;
  input: InputManager;
  audio: AudioEngine;
  opts: LuaRuntimeOptions;
}
