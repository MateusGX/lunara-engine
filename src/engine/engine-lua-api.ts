const CHAR_W = 5,
  CHAR_H = 7;

export type Cost = { instructions: number; vram?: number };
export type CostView = { instructions: string; vram?: string };

const px = (vram: number, overhead: number): Cost => ({
  vram,
  instructions: vram + overhead,
});

const apiInternal = {
  // Drawing
  cls: {
    label: "cls",
    cost: (screenPixels) => px(screenPixels, 10),
    view: { instructions: "spx + 10", vram: "spx" },
  },
  pset: { label: "pset", cost: () => ({ instructions: 4, vram: 1 }) },
  pget: { label: "pget", cost: () => ({ instructions: 2 }) },
  line: {
    label: "line",
    cost: (x0: number, y0: number, x1: number, y1: number) =>
      px(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1, 8),
    view: {
      instructions: "max(abs(x1 - x0),abs(y1 - y0)) + 1 + 8",
      vram: "max(abs(x1 - x0),abs(y1 - y0)) + 1",
    },
  },
  rect: {
    label: "rect",
    cost: (w: number, h: number) => px(2 * (w + h), 8),
    view: { instructions: "(2 * (w + h)) + 8", vram: "2 * (w + h)" },
  },
  rectfill: {
    label: "rectfill",
    cost: (w: number, h: number) => px(w * h, 8),
    view: { instructions: "(w * h) + 8", vram: "w * h" },
  },
  circ: {
    label: "circ",
    cost: (rad: number) => px(Math.ceil(2 * Math.PI * rad), 10),
    view: {
      instructions: "ceil(2 * pi * rad) + 10",
      vram: "ceil(2 * pi * rad)",
    },
  },
  circfill: {
    label: "circfill",
    cost: (rad: number) => px(Math.ceil(Math.PI * rad * rad), 10),
    view: {
      instructions: "ceil(pi * rad * rad) + 10",
      vram: "ceil(pi * rad * rad)",
    },
  },
  spr: {
    label: "spr",
    cost: (sw: number, sh: number, w: number, h: number) =>
      px(w * h * sw * sh, 20),
    view: { instructions: "(w * h * sw * sh) + 20", vram: "(w * h * sw * sh)" },
  },
  map: {
    label: "map",
    cost: (tw: number, th: number, spriteSize = 8) =>
      px(tw * th * spriteSize * spriteSize, 30),
    view: { instructions: "(tw * th * spr²) + 30", vram: "tw * th * spr²" },
  },

  // Text
  print: {
    label: "print",
    cost: (str: string) => px(str.length * CHAR_W * CHAR_H, str.length * 3 + 8),
    view: {
      instructions: "(#str * char_w * char_h) + (#str * 3 + 8)",
      vram: "#str * char_w * char_h",
    },
  },
  cursor: { label: "cursor", cost: () => ({ instructions: 2 }) },

  // Input
  btn: { label: "btn", cost: () => ({ instructions: 2 }) },
  btnp: { label: "btnp", cost: () => ({ instructions: 2 }) },

  // Sound
  sfx: { label: "sfx", cost: () => ({ instructions: 50 }) },
  music: { label: "music", cost: () => ({ instructions: 50 }) },

  // Math
  rnd: { label: "rnd", cost: () => ({ instructions: 4 }) },
  flr: { label: "flr", cost: () => ({ instructions: 2 }) },
  ceil: { label: "ceil", cost: () => ({ instructions: 2 }) },
  abs: { label: "abs", cost: () => ({ instructions: 2 }) },
  min: { label: "min", cost: () => ({ instructions: 2 }) },
  max: { label: "max", cost: () => ({ instructions: 2 }) },
  mid: { label: "mid", cost: () => ({ instructions: 4 }) },
  sin: { label: "sin", cost: () => ({ instructions: 15 }) },
  cos: { label: "cos", cost: () => ({ instructions: 15 }) },
  atan2: { label: "atan2", cost: () => ({ instructions: 15 }) },
  sqrt: { label: "sqrt", cost: () => ({ instructions: 10 }) },

  // State
  time: { label: "time", cost: () => ({ instructions: 2 }) },
  stat: { label: "stat", cost: () => ({ instructions: 2 }) },
  camera: { label: "camera", cost: () => ({ instructions: 4 }) },
  pal: { label: "pal", cost: () => ({ instructions: 4 }) },
  palt: { label: "palt", cost: () => ({ instructions: 4 }) },

  // Std — Globals
  tostring: { label: "tostring", cost: () => ({ instructions: 2 }) },
  tonumber: { label: "tonumber", cost: () => ({ instructions: 2 }) },
  type: { label: "type", cost: () => ({ instructions: 2 }) },
  pairs: { label: "pairs", cost: () => ({ instructions: 2 }) },
  ipairs: { label: "ipairs", cost: () => ({ instructions: 2 }) },
  select: { label: "select", cost: () => ({ instructions: 2 }) },
  unpack: { label: "unpack", cost: () => ({ instructions: 2 }) },
  pcall: { label: "pcall", cost: () => ({ instructions: 4 }) },
  error: { label: "error", cost: () => ({ instructions: 2 }) },
  assert: { label: "assert", cost: () => ({ instructions: 2 }) },
  rawget: { label: "rawget", cost: () => ({ instructions: 2 }) },
  rawset: { label: "rawset", cost: () => ({ instructions: 2 }) },
  setmetatable: { label: "setmetatable", cost: () => ({ instructions: 2 }) },
  getmetatable: { label: "getmetatable", cost: () => ({ instructions: 2 }) },

  // Std — Table
  "table.insert": { label: "table.insert", cost: () => ({ instructions: 4 }) },
  "table.remove": { label: "table.remove", cost: () => ({ instructions: 4 }) },
  "table.sort": { label: "table.sort", cost: () => ({ instructions: 8 }) },
  "table.concat": { label: "table.concat", cost: () => ({ instructions: 4 }) },

} satisfies Record<
  string,
  { label: string; cost: (...args: any[]) => Cost; view?: CostView }
>;

const build = (
  res: Record<
    string,
    { label: string; cost: (...args: any[]) => Cost; view?: CostView }
  >,
): Record<
  string,
  { label: string; cost: (...args: any[]) => Cost; view: CostView }
> => {
  let result: Record<
    string,
    { label: string; cost: (...args: any[]) => Cost; view: CostView }
  > = {};

  Object.entries(res).forEach(([key, value]) => {
    let view: CostView;
    if (!value.view) {
      let cost = value.cost();
      view = {
        instructions: cost.instructions.toString(),
        vram: cost.vram?.toString(),
      };
    } else {
      view = value.view;
    }
    result[key] = {
      ...value,
      view,
    };
  });

  return result;
};

export const api = build(apiInternal);

export type ApiKey = keyof typeof api;
