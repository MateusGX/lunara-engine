export interface InputBinding {
  button: number;
  key: string;
  label: string;
}

export interface HardwareConfig {
  width: number;
  height: number;
  palette: string[]; // hex colors e.g. "#FF004D"
  inputs: InputBinding[];
  maxSprites: number;
  maxSounds: number;
  spriteSize: number;  // default sprite width & height in pixels (e.g. 8)
  sfxSteps: number;    // default step count for new SFX sequences (e.g. 16)
  maxFps: number;        // target frames per second (e.g. 60, 30, 15)
  maxIps: number;        // virtual CPU speed in IPS (e.g. 2_000_000 = 2 MIPS reference)
  maxMemBytes: number;   // bytes — warns/stops if estimated memory exceeds this
  maxStorageBytes: number; // bytes — max serialized cartridge size (sprites + code + sounds + maps)
}

export interface SpriteData {
  id: number;
  name?: string;
  width: number;
  height: number;
  pixels: number[]; // palette color indices, length = width * height
}

export interface MapData {
  id: number;
  name: string;
  tiles: Record<string, number>; // sparse: "col,row" → sprite id
}

export interface SoundNote {
  note: number | null;                          // MIDI note index or null = silent
  volume: number;                               // 0..1
  waveform?: SoundData["waveform"] | null;      // null/undefined = inherit from SoundData
  duration?: number;                            // steps to hold (1 = shortest, default 1)
}

export interface SoundData {
  id: number;
  name: string;
  notes: SoundNote[];
  steps: number; // total steps in sequence
  tempo: number; // BPM
  waveform: "sine" | "square" | "sawtooth" | "triangle";
}

export interface CartridgeMeta {
  id: string;
  name: string;
  author: string;
  description: string;
  created: number; // timestamp ms
  updated: number; // timestamp ms
  version: string;
  coverArt?: string; // base64 data URL
}

export interface ScriptData {
  id: number;
  name: string;
  code: string;
}

export interface Cartridge {
  meta: CartridgeMeta;
  hardware: HardwareConfig;
  scripts: ScriptData[]; // Lua scripts, executed in order
  sprites: SpriteData[];
  maps: MapData[];
  sounds: SoundData[];
}

export interface RunStats {
  cpuPercent: number;
  memoryBytes: number;
  tokenCount: number;
}
