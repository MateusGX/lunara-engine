import type { Cartridge } from "@/types/cartridge";

const DEFAULT_PALETTE = [
  "#000000", // 0  transparent/black
  "#1D2B53", // 1  dark-blue
  "#7E2553", // 2  dark-purple
  "#008751", // 3  dark-green
  "#AB5236", // 4  brown
  "#5F574F", // 5  dark-grey
  "#C2C3C7", // 6  light-grey
  "#FFF1E8", // 7  white
  "#FF004D", // 8  red
  "#FFA300", // 9  orange
  "#FFEC27", // 10 yellow
  "#00E436", // 11 green
  "#29ADFF", // 12 blue
  "#83769C", // 13 lavender
  "#FF77A8", // 14 pink
  "#FFCCAA", // 15 peach
];

const DEFAULT_INPUTS = [
  { button: 0, key: "ArrowLeft", label: "Left" },
  { button: 1, key: "ArrowRight", label: "Right" },
  { button: 2, key: "ArrowUp", label: "Up" },
  { button: 3, key: "ArrowDown", label: "Down" },
  { button: 4, key: "z", label: "A" },
  { button: 5, key: "x", label: "B" },
];

export const DEFAULT_HW = {
  width: 128,
  height: 128,
  palette: [...DEFAULT_PALETTE],
  inputs: DEFAULT_INPUTS,
  maxSprites: 64,
  maxSounds: 32,
  spriteSize: 8,
  sfxSteps: 16,
  maxFps: 30,
  maxIps: 2_000_000,
  maxMemBytes: 256 * 1024,
  maxStorageBytes: 128 * 1024,
};

// ── Sprite pixel data ──────────────────────────────────────────────────────

/** 8×8 player character: white body, red eyes */
const PLAYER_PIXELS = [
  0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 7, 8, 8, 7, 0, 0, 0, 0,
  7, 7, 7, 7, 0, 0, 0, 7, 7, 7, 7, 7, 7, 0, 0, 7, 7, 7, 7, 7, 7, 0, 0, 0, 7, 0,
  0, 7, 0, 0, 0, 0, 7, 0, 0, 7, 0, 0,
];

/** 8×8 ground tile: green top row, brown body with grey specks */
const GROUND_PIXELS = [
  3, 3, 3, 3, 3, 3, 3, 3, 4, 5, 4, 4, 4, 4, 5, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 5, 4, 4, 4, 5, 4, 4, 4, 4, 4, 5, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 5, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4,
];

function emptySound(id: number): Cartridge["sounds"][0] {
  return {
    id,
    name: `SFX ${id}`,
    notes: Array.from({ length: 32 }, () => ({ note: null, volume: 1 })),
    steps: 32,
    tempo: 120,
    waveform: "square",
  };
}

// ── Blank ──────────────────────────────────────────────────────────────────

export function createBlankCartridge(name: string, author = ""): Cartridge {
  const now = Date.now();
  return {
    meta: {
      id: crypto.randomUUID(),
      name,
      author,
      description: "",
      created: now,
      updated: now,
      version: "1.0.0",
    },
    hardware: {
      ...DEFAULT_HW,
      palette: [...DEFAULT_PALETTE],
      inputs: [...DEFAULT_INPUTS],
    },
    scripts: [
      {
        id: 0,
        name: "main",
        code: `-- ${name}\n\nfunction _init()\nend\n\nfunction _update(dt)\nend\n\nfunction _draw()\n  cls(0)\nend\n`,
      },
    ],
    sprites: [{ id: 0, width: 8, height: 8, pixels: new Array(64).fill(0) }],
    maps: [{ id: 0, name: "Map 1", tiles: {} }],
    sounds: [emptySound(0)],
  };
}

// ── Hello World ────────────────────────────────────────────────────────────

export function createDefaultCartridge(name: string, author = ""): Cartridge {
  const now = Date.now();
  return {
    meta: {
      id: crypto.randomUUID(),
      name,
      author,
      description: "",
      created: now,
      updated: now,
      version: "1.0.0",
    },
    hardware: {
      ...DEFAULT_HW,
      palette: [...DEFAULT_PALETTE],
      inputs: [...DEFAULT_INPUTS],
    },
    scripts: [
      {
        id: 0,
        name: "main",
        code: `-- ${name}
-- by ${author || "Player"}

local state = "menu"
local x, y = 60, 60
local start_time = 0
local elapsed = 0

local function fmt_time(t)
  local m = flr(t / 60)
  local s = flr(t % 60)
  return (m<10 and "0" or "")..m..":"..(s<10 and "0" or "")..s
end

function _init()
  x, y = 60, 60
  state = "menu"
  start_time = 0
  elapsed = 0
end

function _update(dt)
  if state == "menu" then
    if btnp(4) then
      state = "play"
      start_time = time()
    end
  elseif state == "play" then
    if btn(0) then x = x - 1 end
    if btn(1) then x = x + 1 end
    if btn(2) then y = y - 1 end
    if btn(3) then y = y + 1 end
    x = mid(0, x, 120)
    y = mid(0, y, 120)
    if btnp(5) then
      elapsed = elapsed + (time() - start_time)
      state = "pause"
    end
  elseif state == "pause" then
    if btnp(5) then
      start_time = time()
      state = "play"
    end
    if btnp(4) then state = "menu" end
  end
end

function _draw()
  cls(1)
  if state == "menu" then
    print("LUNARA!", 44, 36, 7)
    print("A demo game", 32, 50, 6)
    print("arrows - move", 24, 70, 5)
    print("Z - START", 40, 90, 11)
  elseif state == "play" then
    spr(0, x, y)
    local t = elapsed + (time() - start_time)
    print(fmt_time(t), 92, 4, 6)
    print("X-PAUSE", 2, 4, 5)
  elseif state == "pause" then
    spr(0, x, y)
    rectfill(24, 44, 80, 42, 1)
    rect(24, 44, 80, 42, 5)
    print("PAUSED", 46, 52, 7)
    print("X - RESUME", 34, 66, 11)
    print("Z - MENU", 38, 76, 6)
    print(fmt_time(elapsed), 92, 4, 6)
  end
end
`,
      },
    ],
    sprites: [
      {
        id: 0,
        name: "player",
        width: 8,
        height: 8,
        pixels: [...PLAYER_PIXELS],
      },
    ],
    maps: [{ id: 0, name: "Map 1", tiles: {} }],
    sounds: [emptySound(0)],
  };
}

// ── Platformer ─────────────────────────────────────────────────────────────

export function createPlatformerTemplate(name: string, author = ""): Cartridge {
  const now = Date.now();

  // Build map tiles: ground (rows 14-15), two platforms
  const tiles: Record<string, number> = {};
  for (let c = 0; c < 16; c++) {
    tiles[`${c},14`] = 0;
    tiles[`${c},15`] = 0;
  }
  // Platform 1: row 10, cols 2-6
  for (let c = 2; c <= 6; c++) tiles[`${c},10`] = 0;
  // Platform 2: row 7, cols 9-13
  for (let c = 9; c <= 13; c++) tiles[`${c},7`] = 0;

  return {
    meta: {
      id: crypto.randomUUID(),
      name,
      author,
      description: "",
      created: now,
      updated: now,
      version: "1.0.0",
    },
    hardware: {
      ...DEFAULT_HW,
      palette: [...DEFAULT_PALETTE],
      inputs: [...DEFAULT_INPUTS],
    },
    sprites: [
      { id: 0, name: "tile", width: 8, height: 8, pixels: [...GROUND_PIXELS] },
      {
        id: 1,
        name: "player",
        width: 8,
        height: 8,
        pixels: [...PLAYER_PIXELS],
      },
    ],
    maps: [{ id: 0, name: "Level 1", tiles }],
    sounds: [emptySound(0)],
    scripts: [
      {
        id: 0,
        name: "main",
        code: `-- ${name}
-- by ${author || "Player"}

local state = "menu"
local px, py = 60, 104
local vx, vy = 0, 0
local grounded = false
local GRAVITY = 200
local SPEED    = 60
local JUMP     = -140
local start_time = 0
local elapsed = 0

-- platform y-positions (top of tile)
local platforms = {112, 80, 56}
local platform_ranges = {
  {x1=0,   x2=128},  -- ground at y=112
  {x1=16,  x2=56},   -- platform 1 at y=80
  {x1=72,  x2=112},  -- platform 2 at y=56
}

local function fmt_time(t)
  local m = flr(t / 60)
  local s = flr(t % 60)
  return (m<10 and "0" or "")..m..":"..(s<10 and "0" or "")..s
end

local function check_platforms()
  if vy < 0 then return end
  for i, plat_y in ipairs(platforms) do
    local r = platform_ranges[i]
    if px + 6 > r.x1 and px < r.x2 then
      if py + 8 >= plat_y and py + 8 <= plat_y + vy * 0.05 + 4 then
        py = plat_y - 8
        vy = 0
        grounded = true
        return
      end
    end
  end
end

function _init()
  px, py = 60, 104
  vx, vy = 0, 0
  grounded = false
  state = "menu"
  start_time = 0
  elapsed = 0
end

function _update(dt)
  if state == "menu" then
    if btnp(4) then
      state = "play"
      start_time = time()
    end
    return
  end

  if state == "pause" then
    if btnp(5) then start_time = time() state = "play" end
    if btnp(4) then _init() end
    return
  end

  -- play
  if btnp(5) then
    elapsed = elapsed + (time() - start_time)
    state = "pause"
    return
  end

  vx = 0
  if btn(0) then vx = -SPEED end
  if btn(1) then vx =  SPEED end
  if btn(2) and grounded then
    vy = JUMP
    grounded = false
  end

  vy = vy + GRAVITY * dt
  px = px + vx * dt
  py = py + vy * dt

  grounded = false
  check_platforms()

  px = mid(0, px, 120)
end

function _draw()
  cls(1)
  map(0, 0, 0, 0, 16, 16)

  if state == "menu" then
    rectfill(16, 24, 96, 76, 1)
    rect(16, 24, 96, 76, 5)
    print("PLATFORMER", 34, 32, 7)
    print("arrows: move", 28, 46, 5)
    print("up: jump",     40, 56, 5)
    print("X: pause",     40, 70, 5)
    print("Z: start",     40, 84, 11)
    return
  end

  spr(1, px, py)

  local t = elapsed + (time() - start_time)
  print("X:pause", 2,  4, 5)
  print(fmt_time(t), 92, 4, 6)

  if state == "pause" then
    rectfill(24, 42, 80, 48, 1)
    rect(24, 42, 80, 48, 5)
    print("PAUSED",   46, 52, 7)
    print("X:resume", 37, 64, 11)
    print("Z:menu",   43, 76, 6)
  end
end
`,
      },
    ],
  };
}
