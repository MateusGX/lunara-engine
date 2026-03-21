import { DEFAULT_HW } from "@/cartridge/template";
import type { HardwareConfig } from "@/types/cartridge";

export interface HardwarePreset {
  id: string;
  name: string;
  desc: string;
  hw: HardwareConfig;
}

export const DEFAULT_INPUTS = [
  { button: 0, key: "ArrowLeft",  label: "LEFT"   },
  { button: 1, key: "ArrowRight", label: "RIGHT"  },
  { button: 2, key: "ArrowUp",    label: "UP"     },
  { button: 3, key: "ArrowDown",  label: "DOWN"   },
  { button: 4, key: "z",          label: "A"      },
  { button: 5, key: "x",          label: "B"      },
];

export const HARDWARE_PRESETS: HardwarePreset[] = [
  {
    id: "lunara",
    name: "Lunara",
    desc: "128×128 · 30fps · 16 colors",
    hw: { ...DEFAULT_HW },
  },
  {
    id: "gameboy",
    name: "Game Boy",
    desc: "160×144 · 60fps · 4 shades",
    hw: {
      width: 160, height: 144,
      maxSprites: 40, maxSounds: 4,
      spriteSize: 8, sfxSteps: 32,
      maxFps: 60, maxIps: 1_000_000, maxMemBytes: 128 * 1024, maxStorageBytes: 32 * 1024,
      palette: ["#000000","#0f380f","#306230","#8bac0f","#9bbc0f"],
      inputs: [
        ...DEFAULT_INPUTS,
        { button: 6, key: "Enter",     label: "START"  },
        { button: 7, key: "Backspace", label: "SELECT" },
      ],
    },
  },
  {
    id: "nes",
    name: "NES",
    desc: "256×240 · 60fps · 16 colors",
    hw: {
      width: 256, height: 240,
      maxSprites: 64, maxSounds: 5,
      spriteSize: 8, sfxSteps: 32,
      maxFps: 60, maxIps: 1_000_000, maxMemBytes: 256 * 1024, maxStorageBytes: 32 * 1024,
      palette: ["#000000","#7C7C7C","#0000FC","#0000BC","#4428BC","#940084",
                "#A80020","#A81000","#881400","#503000","#007800","#006800",
                "#005800","#004058","#000000","#BCBCBC"],
      inputs: [
        ...DEFAULT_INPUTS,
        { button: 6, key: "Enter",     label: "START"  },
        { button: 7, key: "Backspace", label: "SELECT" },
      ],
    },
  },
  {
    id: "cga",
    name: "CGA",
    desc: "320×200 · 60fps · 4 colors",
    hw: {
      width: 320, height: 200,
      maxSprites: 8, maxSounds: 1,
      spriteSize: 8, sfxSteps: 16,
      maxFps: 60, maxIps: 1_000_000, maxMemBytes: 512 * 1024, maxStorageBytes: 64 * 1024,
      palette: ["#000000","#00AAAA","#AA00AA","#AAAAAA"],
      inputs: [
        ...DEFAULT_INPUTS.slice(0, 5),
        { button: 5, key: "x", label: "FIRE" },
      ],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "128×128 · 15fps · 2 colors",
    hw: {
      width: 128, height: 128,
      maxSprites: 16, maxSounds: 4,
      spriteSize: 8, sfxSteps: 8,
      maxFps: 15, maxIps: 500_000, maxMemBytes: 128 * 1024, maxStorageBytes: 16 * 1024,
      palette: ["#000000","#ffffff"],
      inputs: DEFAULT_INPUTS,
    },
  },
];
