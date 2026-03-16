import { useState } from "react";
import { QuestionIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CodeEditor } from "./code/code-editor";

interface ApiEntry {
  name: string;
  signature: string;
  description: string;
  example: string;
}

interface Category {
  label: string;
  entries: ApiEntry[];
}

const DOCS: Category[] = [
  {
    label: "Variables",
    entries: [
      {
        name: "local",
        signature: "local name = value",
        description:
          "Declares a local variable scoped to the current block or function. Always prefer local — globals are shared across all scripts and can cause hard-to-find bugs.",
        example:
          'local x = 64\nlocal y = 64\nlocal speed = 80\nlocal alive = true\nlocal name  = "hero"\n\n-- local inside a block:\nif alive then\n  local msg = "still here"\n  print(msg, 2, 2, 7)\nend\n-- msg doesn\'t exist here anymore',
      },
      {
        name: "global",
        signature: "name = value",
        description:
          "Assigns a global variable visible from every script. Useful for state that must survive across require'd modules, but overuse leads to conflicts. Prefer local whenever possible.",
        example:
          "-- globals are shared between scripts:\nscore  = 0\nhi_score = 0\n\nfunction add_score(n)\n  score = score + n\n  if score > hi_score then\n    hi_score = score\n  end\nend",
      },
      {
        name: "multiple assignment",
        signature: "a, b, c = v1, v2, v3",
        description:
          "Assigns several variables in one statement. Extra values on the right are discarded; missing ones become nil. Swap two values without a temp variable.",
        example:
          "-- initialise a pair of coords:\nlocal px, py = 32, 64\n\n-- swap without temp variable:\npx, py = py, px\n\n-- unpack a function's multiple returns:\nlocal function bounds()\n  return 0, 0, 128, 128\nend\nlocal x1, y1, x2, y2 = bounds()",
      },
      {
        name: "nil",
        signature: "name = nil",
        description:
          "nil represents the absence of a value. Reading an unset variable returns nil. Assigning nil to a table key removes it. Useful for clearing state or marking something as 'not yet set'.",
        example:
          "local target = nil\n\nfunction _update(dt)\n  -- only chase if a target exists\n  if target ~= nil then\n    move_towards(target.x, target.y, dt)\n  end\nend\n\nfunction clear_target()\n  target = nil\nend",
      },
      {
        name: "type()",
        signature: "type(value)  -->  string",
        description:
          'Returns the type name of any value as a string. Useful for defensive checks before operating on unknown data. Possible values: "nil", "boolean", "number", "string", "table", "function".',
        example:
          'local function describe(v)\n  local t = type(v)\n  if t == "number" then\n    print("number: " .. v, 2, 2, 6)\n  elseif t == "string" then\n    print("string: " .. v, 2, 2, 7)\n  elseif t == "table" then\n    print("table with " .. #v .. " items", 2, 2, 9)\n  else\n    print(t, 2, 2, 5)\n  end\nend',
      },
    ],
  },
  {
    label: "Strings",
    entries: [
      {
        name: "literals",
        signature: "\"text\"  or  'text'",
        description:
          "String literals use double or single quotes — both are identical. Use one style inside the other to avoid escaping. Multi-line strings use [[ ... ]].",
        example:
          "local title  = \"Lunar Quest\"\nlocal author = 'mateus'\n\n-- avoid escape by mixing quotes:\nlocal msg = 'He said \"hello\"'\n\n-- multi-line literal:\nlocal help = [[\n  ARROWS - move\n  Z      - jump\n  X      - attack\n]]",
      },
      {
        name: "concatenation  ..",
        signature: "a .. b",
        description:
          "Joins two strings with ... Numbers are automatically coerced to strings. For many joins, prefer string.format which is cleaner and avoids repeated allocation.",
        example:
          'local score = 42\nlocal lives = 3\n\n-- simple join:\nlocal line1 = "score: " .. score\n\n-- chain:\nlocal line2 = "(" .. lives .. " lives)"\n\n-- display:\nprint(line1 .. "  " .. line2, 2, 2, 7)',
      },
      {
        name: "string.format",
        signature: "string.format(fmt, ...)",
        description:
          "Printf-style formatting. %d = integer, %f = float, %s = string, %02d = zero-padded. Much cleaner than chaining .. for complex messages.",
        example:
          '-- pad a timer to always show two digits:\nlocal mins = flr(t / 60)\nlocal secs = flr(t % 60)\nlocal timer = string.format("%02d:%02d", mins, secs)\nprint(timer, 50, 4, 7)\n\n-- float with 1 decimal:\nlocal fps_str = string.format("%.1f fps", 1 / dt)\nprint(fps_str, 2, 120, 5)',
      },
      {
        name: "string.sub",
        signature: "string.sub(s, i [, j])",
        description:
          "Extracts a substring. Indices are 1-based. Negative indices count from the end (-1 = last char). If j is omitted, goes to the end of the string.",
        example:
          'local s = "hello world"\n\nstring.sub(s, 1, 5)   -- "hello"\nstring.sub(s, 7)      -- "world"\nstring.sub(s, -5)     -- "world"\nstring.sub(s, 2, -2)  -- "ello worl"\n\n-- truncate a name to 8 chars for a leaderboard:\nlocal display = string.sub(player_name, 1, 8)',
      },
      {
        name: "string.len / #",
        signature: "#s  or  string.len(s)",
        description:
          "Returns the byte-length of a string. The # operator is shorthand and preferred. Useful to centre text or cap user input.",
        example:
          'local name = "Arthur"\nlocal len  = #name          -- 6\n\n-- centre text on a 128px screen (each char ~4px wide):\nlocal function print_centred(s, y, c)\n  local x = (128 - #s * 4) / 2\n  print(s, x, y, c)\nend\n\nprint_centred("GAME OVER", 60, 8)',
      },
      {
        name: "string.rep",
        signature: "string.rep(s, n [, sep])",
        description:
          "Repeats string s exactly n times, with optional separator between repetitions.",
        example:
          'string.rep("ab", 3)        -- "ababab"\nstring.rep("*", 5)         -- "*****"\nstring.rep("na", 4, "-")   -- "na-na-na-na"\n\n-- draw a simple HP bar with characters:\nlocal function hp_bar(hp, max)\n  return string.rep("|", hp)\n       .. string.rep(".", max - hp)\nend\nprint(hp_bar(3, 6), 2, 4, 8)  -- "|||..."',
      },
    ],
  },
  {
    label: "Tables",
    entries: [
      {
        name: "array",
        signature: "local t = { v1, v2, v3 }",
        description:
          "Tables used as arrays are 1-indexed. #t gives the length. Use ipairs to iterate in order. Great for lists of enemies, bullets, items, etc.",
        example:
          "local bullets = {}\n\nfunction fire(x, y, vx, vy)\n  table.insert(bullets, { x=x, y=y, vx=vx, vy=vy })\nend\n\nfunction _update(dt)\n  for i = #bullets, 1, -1 do\n    local b = bullets[i]\n    b.x = b.x + b.vx * dt\n    b.y = b.y + b.vy * dt\n    -- remove when off-screen:\n    if b.x < 0 or b.x > 128 then\n      table.remove(bullets, i)\n    end\n  end\nend",
      },
      {
        name: "dictionary",
        signature: "local t = { key = value }",
        description:
          'Named keys create a dictionary (hash map). Access with t.key or t["key"]. Keys can be any value except nil. Perfect for grouping related data into one object.',
        example:
          "local player = {\n  x     = 64,\n  y     = 100,\n  hp    = 5,\n  max_hp = 5,\n  speed = 80,\n  coins = 0,\n}\n\nfunction take_damage(n)\n  player.hp = max(0, player.hp - n)\nend\n\nfunction heal(n)\n  player.hp = min(player.max_hp, player.hp + n)\nend",
      },
      {
        name: "nested tables",
        signature: "t = { { ... }, { ... } }",
        description:
          "Tables can hold other tables, creating grids, trees, or lists of objects. Access with t[row][col] or t.field.sub.",
        example:
          "-- a 4×4 tile grid:\nlocal grid = {\n  { 1, 1, 1, 1 },\n  { 1, 0, 0, 1 },\n  { 1, 0, 0, 1 },\n  { 1, 1, 1, 1 },\n}\n\nfunction _draw()\n  for row = 1, #grid do\n    for col = 1, #grid[row] do\n      local tile = grid[row][col]\n      local x = (col - 1) * 8\n      local y = (row - 1) * 8\n      rectfill(x, y, 8, 8, tile == 1 and 6 or 0)\n    end\n  end\nend",
      },
      {
        name: "table.insert / remove",
        signature: "table.insert(t, v)\ntable.remove(t, i)",
        description:
          "insert appends v (or inserts at index i). remove deletes the element at i (default: last) and shifts everything down. Iterate backwards when removing inside a loop to keep indices valid.",
        example:
          "local enemies = {}\n\n-- spawn:\ntable.insert(enemies, { x=rnd(120), y=0, hp=2 })\n\n-- update & remove dead enemies:\nfunction _update(dt)\n  for i = #enemies, 1, -1 do\n    local e = enemies[i]\n    e.y = e.y + 30 * dt\n    if e.hp <= 0 or e.y > 130 then\n      table.remove(enemies, i)\n    end\n  end\nend",
      },
      {
        name: "table as set",
        signature: "t[key] = true",
        description:
          "Using values as keys gives O(1) membership testing — much faster than scanning an array. Setting the key to nil removes it from the set.",
        example:
          '-- track which collectibles have been picked up:\nlocal collected = {}\n\nfunction collect(id)\n  collected[id] = true\nend\n\nfunction is_collected(id)\n  return collected[id] == true\nend\n\n-- usage:\ncollect("coin_3")\nif is_collected("coin_3") then\n  print("already got it", 2, 2, 5)\nend',
      },
    ],
  },
  {
    label: "Functions",
    entries: [
      {
        name: "declaration",
        signature: "function name(a, b)\n  ...\nend",
        description:
          "Defines a named global function. Functions are first-class values: they can be stored in variables, passed as arguments, and returned from other functions.",
        example:
          "function lerp(a, b, t)\n  return a + (b - a) * t\nend\n\nfunction move_towards(cur, target, speed, dt)\n  local diff = target - cur\n  local step = speed * dt\n  if abs(diff) <= step then\n    return target\n  end\n  return cur + (diff > 0 and step or -step)\nend\n\nfunction _update(dt)\n  px = move_towards(px, tx, 60, dt)\n  py = move_towards(py, ty, 60, dt)\nend",
      },
      {
        name: "local function",
        signature: "local function name(a, b)\n  ...\nend",
        description:
          "A locally scoped function — only visible within the current file. Preferred for helpers that shouldn't pollute the global namespace. Must be declared before first use.",
        example:
          "local function clamp(v, lo, hi)\n  return min(hi, max(lo, v))\nend\n\nlocal function sign(n)\n  if n > 0 then return  1 end\n  if n < 0 then return -1 end\n  return 0\nend\n\nfunction _update(dt)\n  vx = vx + sign(tx - px) * 40 * dt\n  px = px + vx * dt\n  px = clamp(px, 0, 120)\nend",
      },
      {
        name: "multiple return",
        signature: "return v1, v2, v3",
        description:
          "A function can return several values at once. The caller captures them with multiple assignment. Extra returned values are discarded if not captured.",
        example:
          "local function aabb(a, b)\n  local ox = abs(a.x - b.x) - (a.w + b.w) / 2\n  local oy = abs(a.y - b.y) - (a.h + b.h) / 2\n  local hit = ox < 0 and oy < 0\n  return hit, ox, oy\nend\n\nlocal hit, ox, oy = aabb(player, enemy)\nif hit then\n  resolve_collision(ox, oy)\nend",
      },
      {
        name: "anonymous / callback",
        signature: "local fn = function(a) ... end",
        description:
          "Functions stored in variables or passed directly to other functions. Useful for callbacks, event handlers, and higher-order utilities.",
        example:
          "-- sort a list of enemies by distance:\nlocal function dist(e)\n  return sqrt((e.x - px)^2 + (e.y - py)^2)\nend\n\ntable.sort(enemies, function(a, b)\n  return dist(a) < dist(b)\nend)\n\n-- apply a transform to every element:\nlocal function map_tbl(t, fn)\n  local out = {}\n  for i, v in ipairs(t) do\n    out[i] = fn(v)\n  end\n  return out\nend",
      },
      {
        name: "variadic  ...",
        signature: "function name(...)",
        description:
          "... captures any number of extra arguments. Collect them with {...}. Great for printf-style wrappers or functions that forward arguments.",
        example:
          '-- a debug print that prepends a tag:\nlocal function dbg(tag, ...)\n  local parts = { ... }\n  local msg = "[" .. tag .. "] "\n  for _, v in ipairs(parts) do\n    msg = msg .. tostring(v) .. " "\n  end\n  print(msg, 2, cursor_y, 5)\n  cursor_y = cursor_y + 8\nend\n\ndbg("player", px, py, hp)\ndbg("bullets", #bullets)',
      },
    ],
  },
  {
    label: "Control Flow",
    entries: [
      {
        name: "if / elseif / else",
        signature:
          "if cond then\n  ...\nelseif cond then\n  ...\nelse\n  ...\nend",
        description:
          "Conditional execution. Any number of elseif branches are allowed. Lua has no switch/case — use a table of functions instead for many branches.",
        example:
          'function _update(dt)\n  if btn(0) then\n    px = px - speed * dt\n    facing = -1\n  elseif btn(1) then\n    px = px + speed * dt\n    facing = 1\n  end\n\n  if hp <= 0 then\n    state = "dead"\n  elseif hp <= 2 then\n    state = "hurt"\n  else\n    state = "normal"\n  end\nend',
      },
      {
        name: "while",
        signature: "while cond do\n  ...\nend",
        description:
          "Loops while the condition holds. Evaluates the condition before every iteration — if false from the start, the body never runs. Use carefully in _update; infinite loops will hang the game.",
        example:
          "-- generate a non-zero random number:\nlocal function safe_rnd(n)\n  local v\n  while v == nil or v == 0 do\n    v = flr(rnd(n))\n  end\n  return v\nend\n\n-- walk a linked list:\nlocal node = head\nwhile node ~= nil do\n  process(node)\n  node = node.next\nend",
      },
      {
        name: "repeat / until",
        signature: "repeat\n  ...\nuntil cond",
        description:
          "Like while, but the body runs at least once and the condition is checked at the end. Variables declared inside the block are visible in the until condition.",
        example:
          "-- pick a spawn position that doesn't overlap the player:\nlocal ex, ey\nrepeat\n  ex = flr(rnd(14)) * 8 + 4\n  ey = flr(rnd(14)) * 8 + 4\n  local dx = ex - px\n  local dy = ey - py\nuntil dx*dx + dy*dy > 40*40",
      },
      {
        name: "numeric for",
        signature: "for i = start, stop [, step] do\n  ...\nend",
        description:
          "Iterates a counter from start to stop inclusive. step defaults to 1. Use a negative step to count down. The loop variable is local to the loop body.",
        example:
          "-- draw a row of 8 coins:\nfor i = 0, 7 do\n  spr(16, 8 + i * 12, 40)\nend\n\n-- countdown timer display:\nfor s = 3, 1, -1 do\n  cls(0)\n  print(tostring(s), 60, 60, 7)\nend\n\n-- fill a grid with zeros:\nfor row = 1, 8 do\n  for col = 1, 8 do\n    grid[row][col] = 0\n  end\nend",
      },
      {
        name: "ipairs",
        signature: "for i, v in ipairs(t) do\n  ...\nend",
        description:
          "Iterates the array portion of a table in order, from index 1 up to the first nil. i is the 1-based index, v is the value. Stops at the first nil gap.",
        example:
          'local wave = {\n  { x=10, y=0, type="grunt" },\n  { x=50, y=0, type="scout" },\n  { x=90, y=0, type="grunt" },\n}\n\nfunction _draw()\n  for i, e in ipairs(wave) do\n    local spr_id = e.type == "grunt" and 4 or 8\n    spr(spr_id, e.x, e.y)\n    -- health badge:\n    print(tostring(e.hp), e.x, e.y - 6, 8)\n  end\nend',
      },
      {
        name: "pairs",
        signature: "for k, v in pairs(t) do\n  ...\nend",
        description:
          "Iterates ALL keys of a table — both integer array slots and string keys. Order is not defined. Use when you need to inspect every field or when keys are not sequential integers.",
        example:
          'local upgrades = {\n  speed  = 2,\n  damage = 1,\n  shield = 0,\n}\n\n-- show upgrade menu:\nlocal row = 0\nfor name, level in pairs(upgrades) do\n  local label = name .. ": " .. string.rep("*", level)\n  print(label, 10, 20 + row * 10, 7)\n  row = row + 1\nend',
      },
      {
        name: "break",
        signature: "break",
        description:
          "Immediately exits the nearest enclosing for, while, or repeat loop. Useful for early exit on find/search operations. Lua has no continue — use an if block or a local function instead.",
        example:
          "-- find the first live enemy:\nlocal target = nil\nfor i, e in ipairs(enemies) do\n  if e.hp > 0 then\n    target = e\n    break  -- stop scanning once found\n  end\nend\n\n-- check bullet–enemy collisions, stop on first hit:\nfor _, b in ipairs(bullets) do\n  for i, e in ipairs(enemies) do\n    if collides(b, e) then\n      e.hp = e.hp - 1\n      b.dead = true\n      break\n    end\n  end\nend",
      },
    ],
  },
  {
    label: "Operators",
    entries: [
      {
        name: "arithmetic",
        signature: "+  -  *  /  %  ^  -n",
        description:
          "+ add, - subtract, * multiply, / divide (always float), % modulo (remainder), ^ power, unary - negate. Integer division: use flr(a/b).",
        example:
          "-- physics step:\nvx = vx + ax * dt\npx = px + vx * dt\n\n-- wrap position around screen:\npx = (px + 128) % 128\n\n-- oscillate using power of time:\nlocal scale = 1 + 0.2 * sin(time() ^ 1.5)\n\n-- integer division:\nlocal tile_col = flr(px / 8)\nlocal tile_row = flr(py / 8)",
      },
      {
        name: "comparison",
        signature: "==  ~=  <  >  <=  >=",
        description:
          "All return a boolean. ~= means not-equal (not != like other languages). Comparisons between different types (number vs string) always return false for == and error for < / >.",
        example:
          "-- different states based on thresholds:\nif hp == 0 then\n  trigger_death()\nelseif hp ~= max_hp then\n  show_damage_flash()\nend\n\n-- sort-style clamped lerp:\nlocal function smoothstep(edge0, edge1, x)\n  local t = mid(0, (x - edge0) / (edge1 - edge0), 1)\n  return t * t * (3 - 2 * t)\nend",
      },
      {
        name: "logical",
        signature: "and  or  not",
        description:
          "and/or don't return booleans — they return one of their operands. and returns the first falsy value or the last value. or returns the first truthy value. This enables a concise ternary pattern.",
        example:
          '-- ternary idiom (condition and v_true or v_false):\nlocal label = alive and "alive" or "dead"\nlocal spr_id = facing > 0 and 2 or 3\n\n-- safe default:\nlocal vol = cfg.volume or 1.0\n\n-- guard before calling:\nalive and update_physics(dt)\n\n-- combine guards:\nif on_ground and btnp(4) then\n  jump()\nend',
      },
      {
        name: "falsy values",
        signature: "false  nil",
        description:
          'Only false and nil evaluate as false in Lua. The number 0, empty string "", and empty table {} are all truthy. This differs from many other languages — be careful with numeric checks.',
        example:
          "-- WRONG: testing for zero this way is always truthy\nif ammo then fire() end  -- fires even when ammo == 0!\n\n-- CORRECT: explicit comparison:\nif ammo > 0 then fire() end\n\n-- nil check (variable not yet set):\nif target == nil then\n  find_new_target()\nend\n\n-- not nil and not false:\nif result then\n  use(result)\nend",
      },
    ],
  },
  {
    label: "Lifecycle",
    entries: [
      {
        name: "_init",
        signature: "function _init()",
        description:
          "Called exactly once when the cartridge starts. Set up all initial game state here — positions, scores, tables, timers. Runs before the first _update or _draw.",
        example:
          "local px, py, vx, vy\nlocal score, lives\nlocal bullets, enemies\n\nfunction _init()\n  px, py = 64, 100\n  vx, vy = 0, 0\n  score  = 0\n  lives  = 3\n  bullets = {}\n  enemies = {}\n  spawn_wave(1)\nend",
      },
      {
        name: "_update",
        signature: "function _update(dt)",
        description:
          "Called every frame before _draw. dt is delta-time in seconds (~0.0167 at 60 fps). Multiply all velocities and timers by dt to make movement frame-rate independent.",
        example:
          "function _update(dt)\n  -- movement:\n  vx = 0\n  if btn(0) then vx = -80 end\n  if btn(1) then vx =  80 end\n\n  -- jump:\n  if on_ground and btnp(4) then\n    vy = -250\n  end\n\n  -- gravity:\n  vy = vy + 400 * dt\n\n  -- integrate:\n  px = px + vx * dt\n  py = py + vy * dt\n\n  -- floor:\n  if py >= 110 then\n    py = 110\n    vy = 0\n    on_ground = true\n  end\nend",
      },
      {
        name: "_draw",
        signature: "function _draw()",
        description:
          "Called every frame after _update. Do all rendering here — never in _update. Always start with cls() to clear the previous frame, unless you want trails.",
        example:
          'function _draw()\n  cls(1)              -- clear to dark blue\n\n  -- tilemap background:\n  map(0, 0, 0, 0, 16, 14)\n\n  -- player:\n  local spr_id = vx ~= 0 and 2 or 1\n  spr(spr_id, px - 4, py - 8)\n\n  -- enemies:\n  for _, e in ipairs(enemies) do\n    spr(e.spr, e.x - 4, e.y - 8)\n  end\n\n  -- HUD:\n  print("score " .. score, 2, 2, 7)\n  for i = 1, lives do\n    spr(16, 100 + (i-1)*9, 1)\n  end\nend',
      },
    ],
  },
  {
    label: "Drawing",
    entries: [
      {
        name: "cls",
        signature: "cls(c)",
        description:
          "Fills the entire screen with palette color c. Call at the start of _draw every frame to avoid ghosting from the previous frame. Omitting it creates a motion-trail effect.",
        example:
          "function _draw()\n  cls(0)  -- clear to black each frame\n\n  -- draw everything on top:\n  map(0, 0, 0, 0, 16, 16)\n  spr(0, px, py)\nend\n\n-- trail effect: don't cls, just darken with a transparent rect:\n-- (advanced: draw a semi-opaque black rect instead)",
      },
      {
        name: "pset / pget",
        signature: "pset(x, y, c)\npget(x, y)  -->  c",
        description:
          "pset sets one pixel; pget reads one pixel's palette index. Slow for large areas — use rect/circ for fills. Useful for custom pixel-art effects or reading collision masks baked into the screen.",
        example:
          "-- draw a starfield:\nfunction _init()\n  stars = {}\n  for i = 1, 40 do\n    table.insert(stars, {\n      x = rnd(128), y = rnd(128),\n      spd = 0.5 + rnd(2)\n    })\n  end\nend\n\nfunction _draw()\n  cls(0)\n  for _, s in ipairs(stars) do\n    pset(flr(s.x), flr(s.y), 7)\n    s.y = (s.y + s.spd) % 128\n  end\nend",
      },
      {
        name: "line",
        signature: "line(x0, y0, x1, y1, c)",
        description:
          "Draws a 1-pixel wide line. Useful for laser beams, debug vectors, or connecting two points.",
        example:
          "-- draw crosshair at cursor:\nlocal cx, cy = 64, 64\nline(cx - 6, cy,     cx + 6, cy,     7)  -- horizontal\nline(cx,     cy - 6, cx,     cy + 6, 7)  -- vertical\n\n-- draw a velocity vector (debug):\nline(px, py, px + vx * 0.1, py + vy * 0.1, 8)",
      },
      {
        name: "rect / rectfill",
        signature: "rect(x, y, w, h, c)\nrectfill(x, y, w, h, c)",
        description:
          "rect draws a hollow rectangle outline; rectfill draws a solid filled rectangle. x,y is the top-left corner.",
        example:
          "-- health bar:\nlocal function draw_hp_bar(x, y, hp, max)\n  local w = 40\n  local filled = flr(w * hp / max)\n  rectfill(x,          y, w,      5, 1)  -- background\n  rectfill(x,          y, filled, 5, 8)  -- filled (red)\n  rect    (x - 1, y - 1, w + 2,  7, 7)  -- border\nend\n\ndraw_hp_bar(44, 118, player.hp, player.max_hp)",
      },
      {
        name: "circ / circfill",
        signature: "circ(x, y, r, c)\ncircfill(x, y, r, c)",
        description:
          "circ draws a circle outline; circfill fills it. x,y is the centre, r is the radius in pixels.",
        example:
          "-- pulsing ring effect:\nfunction _draw()\n  cls(0)\n  local r = 20 + sin(time() * 3) * 8\n  circ    (64, 64, r,     7)  -- outer ring\n  circfill(64, 64, r - 4, 1)  -- dark fill\n  spr(0,  60, 60)             -- sprite on top\nend",
      },
      {
        name: "spr",
        signature: "spr(n, x, y [, w, h])",
        description:
          "Draws sprite number n at pixel position (x,y). w,h are in sprite units (default 1×1). Color 0 is transparent by default — change with palt().",
        example:
          "-- animated walk cycle (4 frames, 8px each):\nlocal frame_timer = 0\nlocal frame       = 0\n\nfunction _update(dt)\n  if vx ~= 0 then\n    frame_timer = frame_timer + dt\n    if frame_timer > 0.12 then\n      frame_timer = 0\n      frame = (frame + 1) % 4\n    end\n  end\nend\n\nfunction _draw()\n  cls(0)\n  spr(frame, px, py)          -- 1×1\n  spr(8, boss_x, boss_y, 2, 2) -- 2×2 boss\nend",
      },
      {
        name: "map",
        signature: "map(tx, ty, sx, sy, tw, th [, id])",
        description:
          "Draws a rectangular region of a tilemap. tx,ty = tile offset in the map; sx,sy = pixel position on screen; tw,th = tile count to draw; id = map index (default 0).",
        example:
          "local cam_x, cam_y = 0, 0\n\nfunction _update(dt)\n  -- scroll camera to follow player:\n  cam_x = flr(px - 64)\n  cam_y = flr(py - 64)\nend\n\nfunction _draw()\n  cls(0)\n  -- draw map layer 0 scrolled by camera:\n  map(0, 0, -cam_x, -cam_y, 32, 32, 0)\n  -- draw foreground layer 1 on top:\n  map(0, 0, -cam_x, -cam_y, 32, 32, 1)\n  -- draw player at screen centre:\n  spr(0, px - cam_x, py - cam_y)\nend",
      },
    ],
  },
  {
    label: "Text",
    entries: [
      {
        name: "print",
        signature: "print(str, x, y, c)",
        description:
          "Draws a text string at pixel position (x,y) in palette color c. Each character is roughly 4×6 pixels. Without x,y,c, prints at the current cursor position and advances it.",
        example:
          'function _draw()\n  cls(0)\n\n  -- HUD top-left:\n  print("score: " .. score, 2, 2, 7)\n\n  -- centred title:\n  local title = "GAME OVER"\n  local tx = (128 - #title * 4) / 2\n  print(title, tx, 56, 8)\n\n  -- multiline via cursor:\n  cursor(4, 80)\n  print("press Z to retry")\n  print("press X for menu")\nend',
      },
      {
        name: "cursor",
        signature: "cursor(x, y)",
        description:
          "Moves the text cursor to (x,y). Subsequent print() calls without coordinates start from here and advance downward by one line height (~8px).",
        example:
          'function draw_stats()\n  cursor(4, 4)\n  print("hp:    " .. hp)\n  print("coins: " .. coins)\n  print("level: " .. level)\n  -- each print advances cursor by ~8px vertically\nend',
      },
    ],
  },
  {
    label: "Input",
    entries: [
      {
        name: "btn",
        signature: "btn(i)  -->  boolean",
        description:
          "Returns true every frame the button is held. Use for continuous actions like movement. Button indices: 0=left, 1=right, 2=up, 3=down, 4=A (Z key), 5=B (X key).",
        example:
          "function _update(dt)\n  vx = 0\n  if btn(0) then vx = -speed end\n  if btn(1) then vx =  speed end\n\n  -- hold B to sprint:\n  if btn(5) then vx = vx * 2 end\n\n  -- diagonal movement normalisation:\n  local moving_x = btn(0) or btn(1)\n  local moving_y = btn(2) or btn(3)\n  if moving_x and moving_y then\n    vx = vx * 0.707\n    vy = vy * 0.707\n  end\nend",
      },
      {
        name: "btnp",
        signature: "btnp(i)  -->  boolean",
        description:
          "Returns true only on the single frame a button is first pressed — no auto-repeat. Use for one-shot actions like jumping, shooting, or toggling menus.",
        example:
          "function _update(dt)\n  -- jump only fires once per press:\n  if on_ground and btnp(4) then\n    vy     = -jump_force\n    on_ground = false\n    sfx(0)  -- jump sound\n  end\n\n  -- toggle pause menu:\n  if btnp(5) then\n    paused = not paused\n  end\n\n  if paused then return end\n\n  -- normal game update below...\nend",
      },
    ],
  },
  {
    label: "Sound",
    entries: [
      {
        name: "sfx",
        signature: "sfx(n)",
        description:
          "Plays sound effect at index n once. Sound effects are created in the Sound editor tab. Use for one-shot events: jumps, hits, coin pickups, explosions.",
        example:
          '-- play sounds on game events:\nfunction take_damage(n)\n  hp = hp - n\n  sfx(2)  -- hurt sound\n  if hp <= 0 then\n    sfx(5)  -- death sound\n    state = "dead"\n  end\nend\n\nfunction collect_coin()\n  coins = coins + 1\n  sfx(1)  -- coin sound\nend',
      },
      {
        name: "music",
        signature: "music(n)",
        description:
          "Plays music track n in a continuous loop. Pass -1 to stop playback. Typically called once in _init or on state transitions. Only one track plays at a time.",
        example:
          "function _init()\n  music(0)  -- start background music\nend\n\nfunction enter_boss_room()\n  music(3)  -- switch to boss theme\nend\n\nfunction game_over()\n  music(-1)  -- stop all music\n  sfx(6)     -- play sting\nend",
      },
    ],
  },
  {
    label: "Math",
    entries: [
      {
        name: "rnd",
        signature: "rnd(n)  -->  float  [0, n)",
        description:
          "Returns a random float in [0, n). Combine with flr() for random integers. The same seed produces the same sequence — useful for procedural generation.",
        example:
          '-- random int from 1 to 6 (d6):\nlocal roll = flr(rnd(6)) + 1\n\n-- random position on screen:\nlocal x = rnd(120)\nlocal y = rnd(112)\n\n-- pick a random item from a table:\nlocal loot = {"sword", "bow", "potion"}\nlocal pick = loot[flr(rnd(#loot)) + 1]\n\n-- random angle in radians:\nlocal angle = rnd(3.14159 * 2)',
      },
      {
        name: "flr / ceil",
        signature: "flr(n)  ceil(n)",
        description:
          "flr returns the largest integer ≤ n (floor); ceil returns the smallest integer ≥ n (ceiling). Use flr for pixel-perfect positions and tile coordinates.",
        example:
          "-- snap position to 8px grid:\nlocal snap_x = flr(px / 8) * 8\nlocal snap_y = flr(py / 8) * 8\n\n-- tile coordinates from pixel position:\nlocal tile_col = flr(px / 8)\nlocal tile_row = flr(py / 8)\n\n-- number of pages needed:\nlocal pages = ceil(#items / 10)",
      },
      {
        name: "abs / min / max / mid",
        signature: "abs(n)  min(a,b)  max(a,b)  mid(a,b,c)",
        description:
          "abs: absolute value. min/max: smaller/larger of two values. mid: middle of three — equivalent to clamp(val, lo, hi) when called as mid(lo, val, hi).",
        example:
          "-- clamp player inside screen:\npx = mid(0, px, 120)\npy = mid(0, py, 112)\n\n-- approach a target speed smoothly:\nvx = vx + (target_vx - vx) * min(1, 8 * dt)\n\n-- distance check without sqrt:\nlocal dx = abs(ax - bx)\nlocal dy = abs(ay - by)\nif dx < 8 and dy < 8 then\n  on_hit()\nend",
      },
      {
        name: "sin / cos",
        signature: "sin(a)  cos(a)  -- radians",
        description:
          "Trigonometric functions taking radians. Great for circular movement, oscillation, and smooth animation curves. sin(0)=0, sin(π/2)=1. Use time() as the argument to animate.",
        example:
          "-- orbit an object around a point:\nlocal angle = time() * 1.5\nlocal orbit_r = 30\nlocal ox = 64 + cos(angle) * orbit_r\nlocal oy = 64 + sin(angle) * orbit_r\nspr(5, ox, oy)\n\n-- bobbing idle animation:\nlocal bob_y = py + sin(time() * 4) * 2\nspr(0, px, bob_y)\n\n-- shoot in a direction:\nlocal function shoot(angle)\n  table.insert(bullets, {\n    x=px, y=py,\n    vx=cos(angle)*120,\n    vy=sin(angle)*120\n  })\nend",
      },
      {
        name: "atan2 / sqrt",
        signature: "atan2(y, x)  sqrt(n)",
        description:
          "atan2 returns the angle (in radians) pointing from the origin to (x,y) — use for aiming. sqrt returns the square root — use for distance. Both are somewhat expensive; avoid in tight loops.",
        example:
          "-- aim bullet towards mouse / target:\nlocal function angle_to(ax, ay, bx, by)\n  return atan2(by - ay, bx - ax)\nend\n\nlocal a = angle_to(px, py, tx, ty)\ntable.insert(bullets, {\n  vx = cos(a) * 100,\n  vy = sin(a) * 100,\n})\n\n-- exact distance between two points:\nlocal function dist(ax, ay, bx, by)\n  local dx = bx - ax\n  local dy = by - ay\n  return sqrt(dx*dx + dy*dy)\nend",
      },
    ],
  },
  {
    label: "System",
    entries: [
      {
        name: "time",
        signature: "time()  -->  float  (seconds)",
        description:
          "Returns seconds elapsed since the game started as a float. Use as an animation driver — pass it to sin/cos for smooth, endless oscillation without managing your own timer.",
        example:
          "function _draw()\n  cls(0)\n  local t = time()\n\n  -- pulsing colour (cycle through palette every 2s):\n  local c = flr(t * 4) % 8 + 1\n  circfill(64, 64, 20, c)\n\n  -- rotating pointer:\n  local a = t * 2\n  local r = 24\n  line(64, 64,\n       64 + cos(a) * r,\n       64 + sin(a) * r, 7)\nend",
      },
      {
        name: "stat",
        signature: "stat(i)  -->  number",
        description:
          "Returns a runtime statistic. 0 = CPU usage as a percentage (0–100). 1 = estimated memory usage in bytes. Useful for performance profiling overlays during development.",
        example:
          'function _draw()\n  cls(0)\n  -- ... game drawing ...\n\n  -- debug overlay (remove before release):\n  local cpu = stat(0)\n  local mem = stat(1)\n  local c   = cpu > 80 and 8 or 7\n  print(string.format("cpu %d%%", cpu), 2, 2, c)\n  print(string.format("mem %db",  mem), 2, 10, 5)\nend',
      },
      {
        name: "camera",
        signature: "camera(x, y)",
        description:
          "Offsets all subsequent drawing calls by (-x, -y), simulating a scrolling camera. Call camera(0,0) to reset before drawing the HUD so it stays fixed on screen.",
        example:
          'local cam_x, cam_y = 0, 0\n\nfunction _update(dt)\n  -- follow player with 8px dead-zone:\n  local target_x = px - 60\n  local target_y = py - 56\n  cam_x = cam_x + (target_x - cam_x) * 6 * dt\n  cam_y = cam_y + (target_y - cam_y) * 6 * dt\nend\n\nfunction _draw()\n  cls(1)\n  camera(flr(cam_x), flr(cam_y))  -- world space\n  map(0, 0, 0, 0, 32, 32)\n  spr(0, px, py)\n  camera(0, 0)                     -- reset to screen space\n  print("score: " .. score, 2, 2, 7)  -- HUD\nend',
      },
      {
        name: "pal / palt",
        signature: "pal(c0, c1)\npalt(c, transparent)",
        description:
          "pal remaps every draw call that would use color c0 to use c1 instead — great for flash effects, team colours, or day/night. palt sets whether a color index is drawn transparently (default: only color 0 is transparent).",
        example:
          "-- damage flash: replace sprite colours with red for one frame:\nfunction draw_player_hit()\n  pal(7, 8)  -- white → red\n  pal(6, 8)  -- light → red\n  spr(0, px, py)\n  pal(7, 7)  -- reset\n  pal(6, 6)\nend\n\n-- make color 2 transparent so it acts as a second alpha:\npalt(0, true)   -- color 0 transparent (default)\npalt(2, true)   -- also transparent\nspr(4, ex, ey)  -- sprite drawn with both 0 and 2 as clear\npalt(2, false)  -- restore",
      },
    ],
  },
  {
    label: "Modules",
    entries: [
      {
        name: "require",
        signature: 'require("name")  -->  table',
        description:
          "Imports another script by name and returns the table of values it exported. The module is executed once and cached — subsequent require calls return the same table.",
        example:
          '-- in script "main" (id 0):\nlocal vec    = require("vec2")\nlocal entity = require("entity")\n\nfunction _init()\n  player = entity.new(64, 64, 5)\n  vel    = vec.new(0, 0)\nend\n\nfunction _update(dt)\n  if btn(0) then vel.x = -80 end\n  if btn(1) then vel.x =  80 end\n  entity.move(player, vel, dt)\nend',
      },
      {
        name: "export function",
        signature: "export function name(...)\n  ...\nend",
        description:
          "Makes a function available to any script that require()s this module. Only exported symbols are accessible from outside; private helpers stay local.",
        example:
          '-- in script "vec2":\nexport function new(x, y)\n  return { x = x, y = y }\nend\n\nexport function add(a, b)\n  return new(a.x + b.x, a.y + b.y)\nend\n\nexport function length(v)\n  return sqrt(v.x*v.x + v.y*v.y)\nend\n\nexport function normalise(v)\n  local len = length(v)\n  if len == 0 then return new(0,0) end\n  return new(v.x / len, v.y / len)\nend',
      },
      {
        name: "export value",
        signature: "export NAME = value",
        description:
          "Exports a constant or value from a module. Useful for shared configuration, enums, or lookup tables that multiple scripts need to read.",
        example:
          '-- in script "config":\nexport SCREEN_W  = 128\nexport SCREEN_H  = 128\nexport GRAVITY   = 400\nexport JUMP_FORCE = 260\nexport MAX_SPEED  = 120\n\nexport COLORS = {\n  bg      = 0,\n  ground  = 4,\n  player  = 7,\n  enemy   = 8,\n  coin    = 9,\n}\n\n-- in "main":\nlocal cfg = require("config")\nlocal GRAV = cfg.GRAVITY',
      },
    ],
  },
];

function EntryCard({ entry }: { entry: ApiEntry }) {
  return (
    <div className="rounded border border-white/6 bg-white/3 overflow-hidden">
      <div className="flex gap-0 min-h-0">
        {/* Left: signature + description */}
        <div className="flex flex-col gap-2 p-3 w-64 shrink-0 border-r border-white/6">
          <code className="font-mono text-[11px] text-violet-300 whitespace-pre-wrap leading-relaxed">
            {entry.signature}
          </code>
          <p className="text-[11px] leading-relaxed text-zinc-400 whitespace-pre-line">
            {entry.description}
          </p>
        </div>
        {/* Right: syntax-highlighted code example */}
        <div className="flex-1 overflow-x-auto bg-[#282c34]">
          <CodeEditor value={entry.example} basicSetup={false} readOnly />
        </div>
      </div>
    </div>
  );
}

export function LuaDocsDialog() {
  const [activeCategory, setActiveCategory] = useState(DOCS[0].label);
  const category = DOCS.find((c) => c.label === activeCategory) ?? DOCS[0];

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-zinc-500 hover:text-zinc-300"
            >
              <QuestionIcon size={10} />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Lua API reference</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-4xl w-full p-0 gap-0 bg-[#0f0f1a] border-white/10 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-white/8">
          <DialogTitle className="text-sm font-semibold text-zinc-200">
            Lua Reference
          </DialogTitle>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            Language basics and built-in API for all scripts
          </p>
        </DialogHeader>

        <div className="flex" style={{ height: 560 }}>
          {/* Category sidebar */}
          <nav className="flex w-32 shrink-0 flex-col gap-px border-r border-white/8 p-2 overflow-y-auto">
            {DOCS.map((cat) => {
              const active = cat.label === activeCategory;
              return (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`relative flex items-center rounded px-2.5 py-1.5 text-left text-xs transition ${
                    active
                      ? "bg-violet-600/15 text-violet-300"
                      : "text-zinc-500 hover:bg-white/4 hover:text-zinc-300"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-violet-500" />
                  )}
                  {cat.label}
                  <span className="ml-auto text-[9px] text-zinc-700">
                    {cat.entries.length}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Entries */}
          <ScrollArea className="flex-1">
            <div className="space-y-2.5 p-4">
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-3">
                {category.label}
              </h3>
              {category.entries.map((entry) => (
                <EntryCard key={entry.name} entry={entry} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
