const CHAR_W = 5, CHAR_H = 7;

export type Cost     = { instructions: number; vram?: number };
export type CostView = { instructions: string; vram?: string };

type ApiEntry = { cost: (...args: any[]) => Cost; view?: CostView };
type BuiltEntry = { label: string; cost: (...args: any[]) => Cost; view: CostView };

/** Pixel-write cost: vram pixels + a fixed instruction overhead. */
const px = (vram: number, overhead: number): Cost => ({ vram, instructions: vram + overhead });

/** Constant-cost shorthand: just an instruction count, no vram. */
const c = (instructions: number): ApiEntry => ({ cost: () => ({ instructions }) });

// ─── API cost table ───────────────────────────────────────────────────────────

const apiDefs = {
  // Drawing
  cls:      { cost: (spx: number) => px(spx, 10), view: { instructions: "spx + 10", vram: "spx" } },
  pset:     { cost: () => ({ instructions: 4, vram: 1 }) },
  pget:     c(2),
  line:     {
    cost: (x0: number, y0: number, x1: number, y1: number) =>
      px(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1, 8),
    view: { instructions: "max(|Δx|,|Δy|) + 9", vram: "max(|Δx|,|Δy|) + 1" },
  },
  rect:     { cost: (w: number, h: number) => px(2 * (w + h), 8),   view: { instructions: "2(w+h) + 8",   vram: "2(w+h)"   } },
  rectfill: { cost: (w: number, h: number) => px(w * h, 8),          view: { instructions: "w*h + 8",      vram: "w*h"      } },
  circ:     { cost: (r: number) => px(Math.ceil(2 * Math.PI * r), 10),       view: { instructions: "⌈2πr⌉ + 10",  vram: "⌈2πr⌉"    } },
  circfill: { cost: (r: number) => px(Math.ceil(Math.PI * r * r), 10),       view: { instructions: "⌈πr²⌉ + 10",  vram: "⌈πr²⌉"    } },
  spr:      { cost: (sw: number, sh: number, w: number, h: number) => px(w * h * sw * sh, 20), view: { instructions: "w*h*sw*sh + 20", vram: "w*h*sw*sh" } },
  map:      { cost: (tw: number, th: number, sz = 8) => px(tw * th * sz * sz, 30),             view: { instructions: "tw*th*sz² + 30", vram: "tw*th*sz²"  } },

  // Text
  print:  {
    cost: (str: string) => px(str.length * CHAR_W * CHAR_H, str.length * 3 + 8),
    view: { instructions: "#s*(cw*ch + 3) + 8", vram: "#s * cw*ch" },
  },
  cursor: c(2),

  // Input
  btn:  c(2),
  btnp: c(2),

  // Sound
  sfx:   c(50),
  music: c(50),

  // Math
  rnd:   c(4),
  flr:   c(2),
  ceil:  c(2),
  abs:   c(2),
  min:   c(2),
  max:   c(2),
  mid:   c(4),
  sin:   c(15),
  cos:   c(15),
  atan2: c(15),
  sqrt:  c(10),

  // State
  time:   c(2),
  stat:   c(2),
  camera: c(4),
  pal:    c(4),
  palt:   c(4),

  // Stdlib — globals
  tostring:     c(2),
  tonumber:     c(2),
  type:         c(2),
  pairs:        c(2),
  ipairs:       c(2),
  select:       c(2),
  unpack:       c(2),
  pcall:        c(4),
  error:        c(2),
  assert:       c(2),
  rawget:       c(2),
  rawset:       c(2),
  setmetatable: c(2),
  getmetatable: c(2),

  // Stdlib — table
  "table.insert": c(4),
  "table.remove": c(4),
  "table.sort":   c(8),
  "table.concat": c(4),
} satisfies Record<string, ApiEntry>;

// ─── Build (resolves label + view for all entries) ────────────────────────────

function build(defs: Record<string, ApiEntry>): Record<string, BuiltEntry> {
  return Object.fromEntries(
    Object.entries(defs).map(([key, { cost, view }]) => {
      const resolved: CostView = view ?? (() => {
        const { instructions, vram } = cost();
        return { instructions: String(instructions), vram: vram?.toString() };
      })();
      return [key, { label: key, cost, view: resolved }];
    }),
  );
}

export const api = build(apiDefs);
export type ApiKey = keyof typeof apiDefs;
