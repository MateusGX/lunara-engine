import { api } from "@/engine/lua-api-costs";
import type { Completion } from "@codemirror/autocomplete";

export function mkInfo(desc: string, example?: string): Completion["info"] {
  return (completion) => {
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      padding:10px 12px;
      max-width:320px;
      font-size:12px;
      line-height:1.5;
      color:#cdd6f4;
    `;

    const descTitle = document.createElement("div");
    descTitle.textContent = "Description";
    descTitle.style.cssText = `
      font-size:10px;
      text-transform:uppercase;
      letter-spacing:0.05em;
      color:#7f849c;
      margin-bottom:2px;
    `;

    const d = document.createElement("div");
    d.textContent = desc;
    d.style.cssText = `
      color:#bac2de;
      margin-bottom:8px;
    `;

    wrap.appendChild(descTitle);
    wrap.appendChild(d);

    const cost = api[completion.label]?.view;

    if (cost && (cost.vram != null || cost.instructions != null)) {
      const row = document.createElement("div");
      row.style.cssText = `
        display:flex;
        gap:8px;
        margin-bottom:8px;
      `;

      const badge = (label: string, value: string, color: string) => {
        const el = document.createElement("div");
        el.style.cssText = `
          display:flex;
          align-items:center;
          gap:4px;
          padding:3px 7px;
          background:#11111b;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:5px;
          font-size:10px;
          color:${color};
        `;
        el.innerHTML = `<span style="color:#7f849c">${label}</span> ${value}`;
        return el;
      };

      if (cost.vram != null)
        row.appendChild(badge("VRAM", cost.vram, "#89dceb"));
      if (cost.instructions != null)
        row.appendChild(badge("OPS", cost.instructions, "#a6e3a1"));

      wrap.appendChild(row);
    }

    if (example) {
      const exampleTitle = document.createElement("div");
      exampleTitle.textContent = "Example";
      exampleTitle.style.cssText = `
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:0.05em;
        color:#7f849c;
        margin-bottom:3px;
      `;

      const pre = document.createElement("pre");
      pre.style.cssText = `
        margin:0;
        padding:7px 9px;
        background:#11111b;
        border:1px solid rgba(255,255,255,0.06);
        border-radius:6px;
        color:#f9e2af;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size:11px;
        white-space:pre-wrap;
        word-break:break-word;
      `;
      pre.textContent = example;

      wrap.appendChild(exampleTitle);
      wrap.appendChild(pre);
    }

    return wrap;
  };
}

const LUA_KEYWORD_COMPLETIONS: Completion[] = [
  {
    label: "and",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Logical AND operator. Returns true if both operands are true.",
      "if a > 0 and b > 0 then\n  print('both positive')\nend",
    ),
  },

  {
    label: "break",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Exits the current loop immediately.",
      "for i=1,10 do\n  if i == 5 then\n    break\n  end\nend",
    ),
  },

  {
    label: "do",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Starts a block of code.",
      "do\n  local x = 10\n  print(x)\nend",
    ),
  },

  {
    label: "else",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Defines the alternative branch of an if statement.",
      "if x > 0 then\n  print('positive')\nelse\n  print('not positive')\nend",
    ),
  },

  {
    label: "elseif",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Adds another condition to an if statement.",
      "if x > 0 then\n  print('positive')\nelseif x < 0 then\n  print('negative')\nend",
    ),
  },

  {
    label: "end",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Closes blocks such as if, for, while, and functions.",
      "if x > 0 then\n  print(x)\nend",
    ),
  },

  {
    label: "false",
    detail: "",
    type: "keyword",
    info: mkInfo("Boolean false value.", "local active = false"),
  },

  {
    label: "for",
    detail: "",
    type: "keyword",
    info: mkInfo("Starts a for loop.", "for i=1,10 do\n  print(i)\nend"),
  },

  {
    label: "function",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Defines a function.",
      "function add(a, b)\n  return a + b\nend",
    ),
  },

  {
    label: "goto",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Jumps to a labeled statement.",
      "::start::\nprint('loop')\ngoto start",
    ),
  },

  {
    label: "if",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Starts a conditional statement.",
      "if x > 10 then\n  print('big')\nend",
    ),
  },

  {
    label: "in",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Used in generic for loops.",
      "for k,v in pairs(t) do\n  print(k,v)\nend",
    ),
  },

  {
    label: "local",
    detail: "",
    type: "keyword",
    info: mkInfo("Declares a local variable.", "local x = 10"),
  },

  {
    label: "nil",
    detail: "",
    type: "keyword",
    info: mkInfo("Represents the absence of a value.", "local x = nil"),
  },

  {
    label: "not",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Logical NOT operator.",
      "if not ready then\n  print('wait')\nend",
    ),
  },

  {
    label: "or",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Logical OR operator.",
      "if a == 1 or a == 2 then\n  print('valid')\nend",
    ),
  },

  {
    label: "repeat",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Starts a repeat-until loop.",
      "repeat\n  x = x - 1\nuntil x == 0",
    ),
  },

  {
    label: "return",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Returns values from a function.",
      "function add(a,b)\n  return a+b\nend",
    ),
  },

  {
    label: "then",
    detail: "",
    type: "keyword",
    info: mkInfo("Part of an if statement.", "if x > 0 then\n  print(x)\nend"),
  },

  {
    label: "true",
    detail: "",
    type: "keyword",
    info: mkInfo("Boolean true value.", "local enabled = true"),
  },

  {
    label: "until",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Ends a repeat-until loop with its condition.",
      "repeat\n  x = x - 1\nuntil x <= 0",
    ),
  },

  {
    label: "while",
    detail: "",
    type: "keyword",
    info: mkInfo(
      "Starts a while loop.",
      "while x > 0 do\n  print(x)\n  x = x - 1\nend",
    ),
  },
];

const LUA_STD_COMPLETIONS: Completion[] = [
  // globals
  {
    label: "tostring",
    detail: "(v)",
    type: "function",
    info: mkInfo(
      "Convert any value to its string representation.",
      'tostring(42)       -- "42"\ntostring(true)     -- "true"\ntostring(nil)      -- "nil"',
    ),
  },
  {
    label: "tonumber",
    detail: "(v [, base])",
    type: "function",
    info: mkInfo(
      "Convert a string (or number) to a number. Returns nil if conversion fails. base sets the numeric base (2–36).",
      'tonumber("42")      -- 42\ntonumber("ff", 16) -- 255\ntonumber("hi")     -- nil',
    ),
  },
  {
    label: "type",
    detail: "(v)",
    type: "function",
    info: mkInfo(
      'Return the type name of v as a string: "nil", "boolean", "number", "string", "table", "function".',
      'type(42)      -- "number"\ntype("hi")    -- "string"\ntype({})      -- "table"',
    ),
  },
  {
    label: "pairs",
    detail: "(t)",
    type: "function",
    info: mkInfo(
      "Returns an iterator over all key-value pairs in t (array + hash). Order is undefined.",
      "for k, v in pairs(t) do\n  print(k, v)\nend",
    ),
  },
  {
    label: "ipairs",
    detail: "(t)",
    type: "function",
    info: mkInfo(
      "Returns an iterator over the array part of t in order (1, 2, …). Stops at the first nil.",
      "for i, v in ipairs(t) do\n  print(i, v)\nend",
    ),
  },
  {
    label: "select",
    detail: "(index, ...)",
    type: "function",
    info: mkInfo(
      'If index is a number, returns all arguments from that index on. If index is "#", returns the total count.',
      'select(2, "a","b","c")  -- "b","c"\nselect("#", 10, 20, 30) -- 3',
    ),
  },
  {
    label: "unpack",
    detail: "(t [, i [, j]])",
    type: "function",
    info: mkInfo(
      "Returns t[i], t[i+1], …, t[j] as multiple values. Defaults: i=1, j=#t.",
      "local a, b, c = unpack({10, 20, 30})\nprint(a, b, c)  -- 10  20  30",
    ),
  },
  {
    label: "pcall",
    detail: "(f, ...)",
    type: "function",
    info: mkInfo(
      "Calls f in protected mode. Returns true + results on success, or false + error message on failure.",
      'local ok, err = pcall(function()\n  error("oops")\nend)\nif not ok then print(err) end',
    ),
  },
  {
    label: "error",
    detail: "(msg [, level])",
    type: "function",
    info: mkInfo(
      "Raises a runtime error with msg. level=1 (default) points the error at the call site; level=0 adds no position info.",
      'local function div(a, b)\n  if b == 0 then error("division by zero") end\n  return a / b\nend',
    ),
  },
  {
    label: "assert",
    detail: "(v [, msg])",
    type: "function",
    info: mkInfo(
      "If v is falsy, raises an error with msg (default: 'assertion failed!'). Otherwise returns all its arguments.",
      'local x = tonumber(s)\nassert(x, "expected a number")\n-- x is guaranteed non-nil here',
    ),
  },
  {
    label: "rawget",
    detail: "(t, k)",
    type: "function",
    info: mkInfo(
      "Gets t[k] without triggering __index metamethods.",
      'local v = rawget(t, "key")',
    ),
  },
  {
    label: "rawset",
    detail: "(t, k, v)",
    type: "function",
    info: mkInfo(
      "Sets t[k] = v without triggering __newindex metamethods.",
      'rawset(t, "key", 42)',
    ),
  },
  {
    label: "setmetatable",
    detail: "(t, mt)",
    type: "function",
    info: mkInfo(
      "Sets the metatable of table t to mt. Returns t. Used to implement OOP, operator overloading, etc.",
      "local mt = { __index = Base }\nsetmetatable(obj, mt)",
    ),
  },
  {
    label: "getmetatable",
    detail: "(t)",
    type: "function",
    info: mkInfo(
      "Returns the metatable of t, or nil if none is set.",
      "local mt = getmetatable(obj)",
    ),
  },
  // # operator
  {
    label: "#",
    detail: "t  or  s",
    type: "keyword",
    info: mkInfo(
      "Returns the length of a string (bytes) or the array part of a table. Built into the Lua VM — no function call. Unreliable on tables with nil gaps.",
      'local n = #items       -- table length\nlocal l = #"hello"     -- 5\n\nfor i = 1, #items do\n  print(items[i], 2, 2 + (i-1)*8, 7)\nend',
    ),
  },
  // table.*
  {
    label: "table.insert",
    detail: "(t, [pos,] v)",
    type: "function",
    info: mkInfo(
      "Append v to the end of t, or insert at index pos shifting others right.",
      'table.insert(list, "item")       -- append\ntable.insert(list, 1, "first")  -- prepend',
    ),
  },
  {
    label: "table.remove",
    detail: "(t [, pos])",
    type: "function",
    info: mkInfo(
      "Remove and return element at pos (default: last). Shifts subsequent elements left.",
      "local last = table.remove(list)     -- pop\nlocal first = table.remove(list, 1) -- shift",
    ),
  },
  {
    label: "table.sort",
    detail: "(t [, comp])",
    type: "function",
    info: mkInfo(
      "Sort t in-place. comp(a, b) should return true if a comes before b.",
      "table.sort(scores)  -- ascending\ntable.sort(scores, function(a,b) return a > b end)",
    ),
  },
  {
    label: "table.concat",
    detail: "(t [, sep [, i [, j]]])",
    type: "function",
    info: mkInfo(
      "Concatenate string elements of t into one string, separated by sep.",
      'table.concat({"a","b","c"}, ", ")  -- "a, b, c"',
    ),
  },
  // pi constant
  {
    label: "pi",
    detail: "",
    type: "constant",
    info: mkInfo("The value of π (3.14159…).", "local tau = pi * 2\nlocal x = cos(time()) * 30\nlocal y = sin(time()) * 30"),
  },
];

const LUA_API_COMPLETIONS: Completion[] = [
  // ── Drawing ──────────────────────────────────────────────────────────────
  {
    label: "cls",
    detail: "(c)",
    type: "function",
    info: mkInfo(
      "Fill the entire screen with palette color c.",
      "cls(0)  -- clear to black\ncls(1)  -- clear to dark-blue",
    ),
  },
  {
    label: "pset",
    detail: "(x, y, c)",
    type: "function",
    info: mkInfo(
      "Set a single pixel at (x,y) to palette color c.",
      "pset(64, 64, 8)  -- red dot at center",
    ),
  },
  {
    label: "pget",
    detail: "(x, y)",
    type: "function",
    info: mkInfo(
      "Return the palette color index of the pixel at (x,y).",
      "local c = pget(64, 64)",
    ),
  },
  {
    label: "line",
    detail: "(x0,y0,x1,y1,c)",
    type: "function",
    info: mkInfo(
      "Draw a line from (x0,y0) to (x1,y1) in color c.",
      "line(0, 0, 127, 127, 7)  -- white diagonal",
    ),
  },
  {
    label: "rect",
    detail: "(x,y,w,h,c)",
    type: "function",
    info: mkInfo(
      "Draw a rectangle outline. x,y = top-left, w,h = size.",
      "rect(10, 10, 20, 20, 6)",
    ),
  },
  {
    label: "rectfill",
    detail: "(x,y,w,h,c)",
    type: "function",
    info: mkInfo(
      "Draw a filled rectangle. x,y = top-left, w,h = size.",
      "rectfill(0, 112, 128, 16, 3)  -- ground bar",
    ),
  },
  {
    label: "circ",
    detail: "(x,y,r,c)",
    type: "function",
    info: mkInfo(
      "Draw a circle outline at (x,y) with radius r.",
      "circ(64, 64, 10, 7)",
    ),
  },
  {
    label: "circfill",
    detail: "(x,y,r,c)",
    type: "function",
    info: mkInfo(
      "Draw a filled circle at (x,y) with radius r.",
      "circfill(px, py, 4, 8)  -- red filled ball",
    ),
  },
  {
    label: "spr",
    detail: "(n,x,y[,w,h])",
    type: "function",
    info: mkInfo(
      "Draw sprite n at (x,y). Optional w,h in sprite units (default 1).",
      "spr(0, px, py)        -- single sprite\nspr(0, px, py, 2, 2)  -- 2×2 sprite",
    ),
  },
  {
    label: "map",
    detail: "(tx,ty,sx,sy,tw,th[,id])",
    type: "function",
    info: mkInfo(
      "Draw a region of a map.\n" +
        "  tx,ty  — tile offset inside the map to start reading from\n" +
        "  sx,sy  — pixel position on screen to draw at\n" +
        "  tw,th  — number of tiles to draw (width × height)\n" +
        "  id     — map index (optional, default 0)",
      "-- draw the whole first map\nmap(0, 0, 0, 0, 16, 16)\n\n-- draw with camera scroll\nmap(0, 0, -cam_x, -cam_y, 16, 16)\n\n-- draw second map at screen pos (0,0)\nmap(0, 0, 0, 0, 16, 16, 1)",
    ),
  },
  // ── Text ─────────────────────────────────────────────────────────────────
  {
    label: "print",
    detail: "(str,x,y,c)",
    type: "function",
    info: mkInfo(
      "Draw text at (x,y) in color c. Omit x,y,c to print at the cursor.",
      'print("score: "..score, 2, 2, 7)\nprint("hi!")  -- uses cursor position',
    ),
  },
  {
    label: "cursor",
    detail: "(x,y)",
    type: "function",
    info: mkInfo(
      "Move the text cursor to (x,y) for the next print() call.",
      'cursor(4, 4)\nprint("HP: "..hp)',
    ),
  },
  // ── Input ─────────────────────────────────────────────────────────────────
  {
    label: "btn",
    detail: "(i)",
    type: "function",
    info: mkInfo(
      "Return true while button i is held. Buttons: 0=left 1=right 2=up 3=down 4=A 5=B.",
      "if btn(0) then x = x - 1 end\nif btn(4) then shoot() end",
    ),
  },
  {
    label: "btnp",
    detail: "(i)",
    type: "function",
    info: mkInfo(
      "Return true only on the first frame button i is pressed (no repeat).",
      "if btnp(4) then jump() end",
    ),
  },
  // ── Sound ─────────────────────────────────────────────────────────────────
  {
    label: "sfx",
    detail: "(n)",
    type: "function",
    info: mkInfo(
      "Play sound effect at index n once.",
      "sfx(0)  -- play first sound",
    ),
  },
  {
    label: "music",
    detail: "(n)",
    type: "function",
    info: mkInfo(
      "Play music track n in a loop. Pass -1 to stop.",
      "music(0)   -- start looping track 0\nmusic(-1)  -- stop music",
    ),
  },
  // ── Math ──────────────────────────────────────────────────────────────────
  {
    label: "rnd",
    detail: "(n)",
    type: "function",
    info: mkInfo(
      "Return a random float in [0, n).",
      "local x = rnd(128)     -- random x on screen\nlocal d = flr(rnd(6))+1 -- d6 roll",
    ),
  },
  {
    label: "flr",
    detail: "(n)",
    type: "function",
    info: mkInfo(
      "Return the largest integer ≤ n (floor).",
      "local tx = flr(px / 8)  -- tile column",
    ),
  },
  {
    label: "ceil",
    detail: "(n)",
    type: "function",
    info: mkInfo(
      "Return the smallest integer ≥ n (ceiling).",
      "local rows = ceil(count / 4)",
    ),
  },
  {
    label: "abs",
    detail: "(n)",
    type: "function",
    info: mkInfo(
      "Return the absolute value of n.",
      "local dist = abs(ax - bx)",
    ),
  },
  {
    label: "min",
    detail: "(a,b)",
    type: "function",
    info: mkInfo(
      "Return the smaller of a and b.",
      "x = min(x + spd, 120)  -- clamp right edge",
    ),
  },
  {
    label: "max",
    detail: "(a,b)",
    type: "function",
    info: mkInfo(
      "Return the larger of a and b.",
      "x = max(x - spd, 0)  -- clamp left edge",
    ),
  },
  {
    label: "mid",
    detail: "(a,b,c)",
    type: "function",
    info: mkInfo(
      "Return the middle value of a, b, c. Useful for clamping.",
      "x = mid(0, x, 120)  -- clamp x between 0 and 120",
    ),
  },
  {
    label: "sin",
    detail: "(a)",
    type: "function",
    info: mkInfo(
      "Return the sine of a (radians).",
      "local y = 64 + sin(time()) * 20  -- bobbing motion",
    ),
  },
  {
    label: "cos",
    detail: "(a)",
    type: "function",
    info: mkInfo(
      "Return the cosine of a (radians).",
      "local x = 64 + cos(time()) * 20",
    ),
  },
  {
    label: "atan2",
    detail: "(y,x)",
    type: "function",
    info: mkInfo(
      "Return the angle in radians from origin to (x,y).",
      "local angle = atan2(ty - py, tx - px)",
    ),
  },
  {
    label: "sqrt",
    detail: "(n)",
    type: "function",
    info: mkInfo(
      "Return the square root of n.",
      "local dist = sqrt((bx-ax)^2 + (by-ay)^2)",
    ),
  },
  // ── State ─────────────────────────────────────────────────────────────────
  {
    label: "time",
    detail: "()",
    type: "function",
    info: mkInfo(
      "Return seconds elapsed since the game started.",
      "local t = time()\nlocal wave = sin(t * 3) * 10",
    ),
  },
  {
    label: "stat",
    detail: "(i)",
    type: "function",
    info: mkInfo(
      "Return a runtime stat. 0 = CPU usage %, 1 = estimated memory bytes.",
      'print(stat(0).."%", 2, 2, 6)  -- show CPU',
    ),
  },
  {
    label: "camera",
    detail: "(x,y)",
    type: "function",
    info: mkInfo(
      "Offset all subsequent drawing by (-x, -y). Call camera(0,0) to reset.",
      "camera(cam_x, cam_y)  -- scroll world\ncamera(0, 0)          -- reset",
    ),
  },
  {
    label: "pal",
    detail: "(c0,c1)",
    type: "function",
    info: mkInfo(
      "Remap palette color c0 to draw as c1 until reset. pal(c,c) resets one slot.",
      "pal(8, 9)  -- draw reds as orange\npal(8, 8)  -- reset slot",
    ),
  },
  {
    label: "palt",
    detail: "(c,t)",
    type: "function",
    info: mkInfo(
      "Set whether palette color c is transparent (t=true) or opaque (t=false).",
      "palt(0, true)   -- color 0 transparent (default)\npalt(2, true)   -- also make color 2 transparent",
    ),
  },
  // ── Modules ───────────────────────────────────────────────────────────────
  {
    label: "require",
    detail: '("name")',
    type: "function",
    info: mkInfo(
      "Import another script as a module. Returns the table of exported values.",
      'local utils = require("utils")\nutils.lerp(a, b, t)',
    ),
  },
  {
    label: "export function",
    detail: "name(...)",
    type: "keyword",
    info: mkInfo(
      "Export a function from this module so other scripts can use it via require.",
      "export function lerp(a, b, t)\n  return a + (b - a) * t\nend",
    ),
  },
  {
    label: "export",
    detail: "NAME = value",
    type: "keyword",
    info: mkInfo(
      "Export a value from this module.",
      "export MAX_SPEED = 120\nexport GRAVITY   = 200",
    ),
  },
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  {
    label: "_init",
    detail: "()",
    type: "function",
    info: mkInfo(
      "Called once when the game starts. Use it to initialise state.",
      "function _init()\n  x, y = 64, 64\n  score = 0\nend",
    ),
  },
  {
    label: "_update",
    detail: "(dt)",
    type: "function",
    info: mkInfo(
      "Called every frame. dt is delta-time in seconds — use it for frame-rate-independent movement.",
      "function _update(dt)\n  x = x + speed * dt\nend",
    ),
  },
  {
    label: "_draw",
    detail: "()",
    type: "function",
    info: mkInfo(
      "Called every frame after _update. Put all drawing calls here.",
      "function _draw()\n  cls(0)\n  spr(0, x, y)\nend",
    ),
  },
];

const ENGINE_API_NAMES = LUA_API_COMPLETIONS.filter(
  (c) =>
    c.type === "function" && !c.label.includes(" ") && !c.label.startsWith("_"),
).map((c) => c.label);

export {
  LUA_API_COMPLETIONS,
  ENGINE_API_NAMES,
  LUA_STD_COMPLETIONS,
  LUA_KEYWORD_COMPLETIONS,
};
