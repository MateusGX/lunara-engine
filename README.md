# Lunara Engine

A fantasy console for making retro-style games with Lua — built entirely in the browser.

Inspired by PICO-8, Lunara gives you a constrained creative environment: a 128×128 pixel canvas, 16-color palette, sprite editor, tilemap builder, step sequencer, and a Lua scripting environment all in one place.

---

## Features

- **Lua scripting** — write game logic with `_init()`, `_update(dt)`, and `_draw()` lifecycle hooks
- **Sprite editor** — pixel-art editor with pencil, fill, eraser, eyedropper, and line tools
- **Tilemap editor** — build levels by painting sprites onto a grid
- **Step sequencer** — compose chiptune music with multiple waveforms (square, sine, sawtooth, triangle)
- **Live preview** — run your game directly in the editor with instant feedback
- **Cartridge format** — export and share games as `.lun` (editable) or `.lunx` (play-only) files
- **Offline first** — projects are stored locally in IndexedDB; no account required

## Lua API

```lua
-- Lifecycle
function _init()     end  -- called once on start
function _update(dt) end  -- called every frame, dt = delta time in seconds
function _draw()     end  -- called every frame after _update

-- Drawing
cls(c)                        -- clear screen with color c
pset(x, y, c)                 -- set pixel
pget(x, y) -> c               -- get pixel color
line(x0, y0, x1, y1, c)      -- draw line
rect(x, y, w, h, c)          -- draw rectangle outline
rectfill(x, y, w, h, c)      -- draw filled rectangle
circ(x, y, r, c)              -- draw circle outline
circfill(x, y, r, c)          -- draw filled circle
spr(n, x, y, [sw, sh])        -- draw sprite n at x,y (sw/sh = tile count)
map(tx, ty, sx, sy, tw, th)   -- draw a region of the tilemap
print(str, x, y, c)           -- draw text

-- Input
btn(i)  -> bool   -- true while button i is held
btnp(i) -> bool   -- true only on the frame button i was pressed

-- Sound
sfx(n)    -- play sound effect n
music(n)  -- loop sound n as music

-- Math helpers
rnd(n)            -- random float 0..n
flr(n), ceil(n)   -- floor / ceil
abs, min, max, mid, sin, cos, atan2, sqrt

-- State
time()    -- seconds since _init
stat(0)   -- CPU usage 0..1
stat(1)   -- memory usage in bytes

-- Camera & palette
camera(x, y)         -- offset all drawing by (x, y)
pal(c0, c1)          -- remap color c0 → c1
palt(c, transparent) -- set color c as transparent (true) or opaque (false)
```

### Default input buttons

| Button | Key     | Label |
| ------ | ------- | ----- |
| 0      | ← Arrow | Left  |
| 1      | → Arrow | Right |
| 2      | ↑ Arrow | Up    |
| 3      | ↓ Arrow | Down  |
| 4      | Z       | A     |
| 5      | X       | B     |

## Cartridge formats

| Format    | Extension | Description                                                   |
| --------- | --------- | ------------------------------------------------------------- |
| Editor    | `.lun`    | Full JSON — preserves all metadata, re-importable for editing |
| Play-only | `.lunx`   | Minified + base64-encoded — lighter, not editable             |

## Getting started

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
pnpm build
```

### Run tests

```bash
pnpm test            # watch mode
pnpm test:coverage   # with coverage report
```

## Project structure

```
src/
├── engine/          # Core runtime (renderer, input, audio, Lua bridge)
├── lib/             # Pure utilities (preprocessor, token counter, export)
├── routes/
│   ├── home/        # Project library
│   ├── editor/      # Full editor (code, sprite, map, sound, settings tabs)
│   ├── player/      # In-editor game preview
│   └── launcher/    # Standalone .lunx player
├── store/           # Zustand state slices
├── db/              # IndexedDB persistence layer
└── types/           # Shared TypeScript types
```

## Hardware limits (defaults)

| Constraint  | Value                     |
| ----------- | ------------------------- |
| Resolution  | 128 × 128 px              |
| Colors      | 16 (customizable palette) |
| Max sprites | 256                       |
| Max sounds  | 64                        |
| CPU budget  | 8 MHz equivalent          |
| Memory      | 2 MB                      |

## Tech stack

- **React 19** + **TypeScript** — UI framework
- **Vite** — build tooling
- **Wasmoon** — Lua 5.4 running in WebAssembly
- **Zustand** — state management
- **IndexedDB / idb** — local project storage
- **CodeMirror 6** — code editor with Lua syntax highlighting
- **Web Audio API** — chiptune synthesis
- **Canvas 2D API** — software pixel renderer
- **Tailwind CSS v4** + **Radix UI** — styling and components
- **Vitest** — unit testing

## License

[Lunara Engine License](LICENSE) © 2026 Mateus Martins
Free to use for creating games. The engine itself may not be resold.
