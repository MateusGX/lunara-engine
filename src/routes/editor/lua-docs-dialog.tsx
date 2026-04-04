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
import { api } from "@/engine/lua-api-costs";

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

const DOCS: Array<Category> = [
  {
    label: "Variables",
    entries: [
      {
        name: "local",
        signature: "local name = value",
        description:
          "Declares a local variable scoped to the current block or function.",
        example:
          'local x = 64\nlocal y = 64\nlocal speed = 80\nlocal alive = true\nlocal name  = "hero"\n\n-- local inside a block:\nif alive then\n  local msg = "still here"\n  print(msg, 2, 2, 7)\nend\n-- msg doesn\'t exist here anymore',
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
          "Joins two strings with .. Numbers are automatically coerced to strings. Use tostring() to be explicit about the conversion.",
        example:
          'local score = 42\nlocal lives = 3\n\n-- simple join:\nlocal line1 = "score: " .. score\n\n-- chain:\nlocal line2 = "(" .. lives .. " lives)"\n\n-- display:\nprint(line1 .. "  " .. line2, 2, 2, 7)',
      },
      {
        name: "# length",
        signature: "#s  -->  number",
        description:
          "Returns the byte-length of a string. Built into the Lua VM — no function call needed. Also works on tables to get the array length.",
        example:
          'local name = "Arthur"\nlocal len  = #name          -- 6\n\n-- centre text on a 128px screen (each char ~4px wide):\nlocal function print_centred(s, y, c)\n  local x = (128 - #s * 4) / 2\n  print(s, x, y, c)\nend\n\nprint_centred("GAME OVER", 60, 8)',
      },
    ],
  },
  {
    label: "Tables",
    entries: [
      {
        name: "# length",
        signature: "#t  -->  number",
        description:
          "Returns the length of the array part of a table — the highest integer index n such that t[n] is not nil. Built into the Lua VM, no function call needed. Does not count string keys. Unreliable if the array has gaps (nil holes).",
        example:
          'local items = { "sword", "bow", "potion" }\nprint(#items)  -- 3\n\n-- safe loop using length:\nfor i = 1, #items do\n  print(items[i], 2, 2 + (i-1)*8, 7)\nend\n\n-- CAUTION: gaps make # unpredictable\nlocal t = { 1, 2, nil, 4 }\nprint(#t)  -- could be 2 or 4, undefined behaviour',
      },
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
        name: "table.insert",
        signature: "table.insert(t, v)\ntable.insert(t, i, v)",
        description:
          "Appends v to the end of t. With an index i, inserts v at that position and shifts subsequent elements up.",
        example:
          "local enemies = {}\n\n-- append to end:\ntable.insert(enemies, { x=rnd(120), y=0, hp=2 })\n\n-- insert at front:\ntable.insert(enemies, 1, { x=64, y=0, hp=5, boss=true })\n\nprint(#enemies)  -- 2",
      },
      {
        name: "table.remove",
        signature: "table.remove(t [, i])",
        description:
          "Removes and returns the element at index i (default: last). Shifts subsequent elements down. Iterate backwards when removing inside a loop to keep indices valid.",
        example:
          "-- remove dead enemies during update:\nfunction _update(dt)\n  for i = #enemies, 1, -1 do\n    local e = enemies[i]\n    e.y = e.y + 30 * dt\n    if e.hp <= 0 or e.y > 130 then\n      table.remove(enemies, i)\n    end\n  end\nend",
      },
      {
        name: "table as set",
        signature: "t[key] = true",
        description:
          "Using values as keys gives O(1) membership testing — much faster than scanning an array. Setting the key to nil removes it from the set.",
        example:
          '-- track which collectibles have been picked up:\nlocal collected = {}\n\nfunction collect(id)\n  collected[id] = true\nend\n\nfunction is_collected(id)\n  return collected[id] == true\nend\n\n-- usage:\ncollect("coin_3")\nif is_collected("coin_3") then\n  print("already got it", 2, 2, 5)\nend',
      },
      {
        name: "table.sort",
        signature: "table.sort(t [, comp])",
        description:
          "Sorts t in-place. Without comp, uses the default < operator (ascending). comp(a, b) must return true if a should come before b. Unstable sort — equal elements may change order.",
        example:
          "-- sort scores descending:\nlocal scores = {42, 7, 99, 18}\ntable.sort(scores, function(a, b) return a > b end)\n-- {99, 42, 18, 7}\n\n-- sort entities by distance to player:\ntable.sort(enemies, function(a, b)\n  local da = abs(a.x-px) + abs(a.y-py)\n  local db = abs(b.x-px) + abs(b.y-py)\n  return da < db\nend)",
      },
      {
        name: "table.concat",
        signature: "table.concat(t [, sep [, i [, j]]])",
        description:
          'Joins the string/number elements of t into one string. sep is inserted between elements (default: ""). i and j restrict the range (default: 1 to #t).',
        example:
          'local parts = {"score", "level", "time"}\ntable.concat(parts, " | ")\n-- "score | level | time"\n\n-- build a CSV line:\nlocal row = {name, score, flr(time())}\nlocal line = table.concat(row, ",")\nprint(line, 2, 2, 7)',
      },
    ],
  },
  {
    label: "Utility",
    entries: [
      {
        name: "tostring",
        signature: "tostring(v)  -->  string",
        description:
          'Converts any value to its string representation. Numbers become decimal strings, booleans become "true"/"false", nil becomes "nil". Used internally by print() when no x,y are given.',
        example:
          'tostring(42)    -- "42"\ntostring(true)  -- "true"\ntostring(nil)   -- "nil"\n\n-- build a HUD line:\nlocal hud = "hp:" .. tostring(hp) .. " mp:" .. tostring(mp)\nprint(hud, 2, 2, 7)',
      },
      {
        name: "tonumber",
        signature: "tonumber(v [, base])  -->  number | nil",
        description:
          "Converts a string (or number) to a number. Returns nil if conversion fails. base sets the numeric base (2–36) for parsing integer strings.",
        example:
          'tonumber("42")      -- 42\ntonumber("3.14")    -- 3.14\ntonumber("ff", 16)  -- 255\ntonumber("hi")      -- nil\n\n-- safe parse from user input:\nlocal v = tonumber(input)\nif v then use(v) else print("bad number", 2, 2, 8) end',
      },
      {
        name: "type",
        signature: "type(v)  -->  string",
        description:
          'Returns the type name of v as a string. Possible values: "nil", "boolean", "number", "string", "table", "function".',
        example:
          'type(42)      -- "number"\ntype("hi")    -- "string"\ntype({})      -- "table"\ntype(nil)     -- "nil"\n\n-- defensive check before operating on a value:\nlocal function safe_add(a, b)\n  assert(type(a) == "number" and type(b) == "number")\n  return a + b\nend',
      },
      {
        name: "pcall",
        signature: "pcall(f, ...)  -->  ok, result",
        description:
          "Calls f in protected mode. Returns true plus any return values on success, or false plus an error message on failure. Use to catch runtime errors without crashing the game.",
        example:
          'local ok, err = pcall(function()\n  error("oops")\nend)\nif not ok then\n  print(err, 2, 2, 8)\nend\n\n-- safe module load:\nlocal ok, mod = pcall(require, "optional_lib")\nif ok then mod.setup() end',
      },
      {
        name: "error",
        signature: "error(msg [, level])",
        description:
          "Raises a runtime error with msg. level=1 (default) adds the call-site location to the message; level=0 adds no location. Caught by pcall.",
        example:
          'local function div(a, b)\n  if b == 0 then\n    error("division by zero")\n  end\n  return a / b\nend\n\nlocal ok, result = pcall(div, 10, 0)\nif not ok then print(result, 2, 2, 8) end',
      },
      {
        name: "assert",
        signature: "assert(v [, msg])",
        description:
          'If v is falsy (false or nil), raises an error with msg (default: "assertion failed!"). Otherwise returns all its arguments unchanged. Good for validating preconditions.',
        example:
          'local function load_sprite(id)\n  local s = sprites[id]\n  assert(s, "sprite " .. id .. " not found")\n  return s\nend\n\n-- assert also returns its first arg, so you can chain:\nlocal x = assert(tonumber(cfg.x), "cfg.x must be a number")',
      },
      {
        name: "setmetatable",
        signature: "setmetatable(t, mt)  -->  t",
        description:
          "Sets the metatable of table t to mt and returns t. Used to implement OOP, operator overloading, and default values via __index.",
        example:
          "local Vec = {}\nVec.__index = Vec\n\nfunction Vec.new(x, y)\n  return setmetatable({ x=x, y=y }, Vec)\nend\n\nfunction Vec:length()\n  return sqrt(self.x^2 + self.y^2)\nend\n\nlocal v = Vec.new(3, 4)\nprint(v:length(), 2, 2, 7)  -- 5",
      },
      {
        name: "unpack",
        signature: "unpack(t [, i [, j]])  -->  ...",
        description:
          "Returns t[i], t[i+1], …, t[j] as individual values. Defaults: i=1, j=#t. Useful for passing a table's elements as function arguments.",
        example:
          "local args = {64, 64, 10, 7}\ncirc(unpack(args))  -- circ(64, 64, 10, 7)\n\nlocal a, b, c = unpack({10, 20, 30})\nprint(a, 2, 2, 7)   -- 10",
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
        name: "anonymous functions",
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
        name: "if / else",
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
        name: "repeat",
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
          'local upgrades = {\n  speed  = 2,\n  damage = 1,\n  shield = 0,\n}\n\n-- show upgrade menu:\nlocal row = 0\nfor name, level in pairs(upgrades) do\n  local label = name .. ": " .. tostring(level)\n  print(label, 10, 20 + row * 10, 7)\n  row = row + 1\nend',
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
          "-- physics step:\nlocal vx = vx + ax * dt\nlocal px = px + vx * dt\n\n-- wrap position around screen:\npx = (px + 128) % 128\n\n-- oscillate using power of time:\nlocal scale = 1 + 0.2 * sin(time() ^ 1.5)\n\n-- integer division:\nlocal tile_col = flr(px / 8)\nlocal tile_row = flr(py / 8)",
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
        name: "pset",
        signature: "pset(x, y, c)",
        description:
          "Sets one pixel at (x,y) to palette colour c. Slow for large areas — use rect/circ for fills. Useful for custom pixel-art effects and procedural drawing.",
        example:
          "-- scrolling starfield:\nfunction _init()\n  stars = {}\n  for i = 1, 40 do\n    table.insert(stars, {\n      x = rnd(128), y = rnd(128),\n      spd = 0.5 + rnd(2)\n    })\n  end\nend\n\nfunction _draw()\n  cls(0)\n  for _, s in ipairs(stars) do\n    pset(flr(s.x), flr(s.y), 7)\n    s.y = (s.y + s.spd) % 128\n  end\nend",
      },
      {
        name: "pget",
        signature: "pget(x, y)  -->  c",
        description:
          "Returns the palette index of the pixel at (x,y). Useful for reading collision masks baked into the screen or detecting what was drawn at a position.",
        example:
          "-- pixel-perfect collision with the map:\n-- draw map to screen first, then check:\nfunction _update(dt)\n  local foot_x = flr(px + 4)\n  local foot_y = flr(py + 8)\n  local c = pget(foot_x, foot_y)\n  -- colour 1 = solid ground\n  if c == 1 then\n    on_ground = true\n    vy = 0\n  end\nend",
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
        name: "rect",
        signature: "rect(x, y, w, h, c)",
        description:
          "Draws a hollow rectangle outline. x,y is the top-left corner, w,h are the dimensions in pixels.",
        example:
          "-- selection box:\nlocal sel_x, sel_y = 20, 20\nlocal sel_w, sel_h = 32, 32\n\nfunction _draw()\n  cls(0)\n  -- outer border:\n  rect(sel_x - 1, sel_y - 1, sel_w + 2, sel_h + 2, 7)\n  -- inner content area:\n  rect(sel_x, sel_y, sel_w, sel_h, 5)\nend",
      },
      {
        name: "rectfill",
        signature: "rectfill(x, y, w, h, c)",
        description:
          "Draws a solid filled rectangle. x,y is the top-left corner. Faster than pset for filling areas.",
        example:
          "-- health bar:\nlocal function draw_hp_bar(x, y, hp, max)\n  local w = 40\n  local filled = flr(w * hp / max)\n  rectfill(x,      y, w,      5, 1)  -- background\n  rectfill(x,      y, filled, 5, 8)  -- filled portion\n  rect    (x - 1, y - 1, w + 2, 7, 7)  -- border\nend\n\ndraw_hp_bar(44, 118, player.hp, player.max_hp)",
      },
      {
        name: "circ",
        signature: "circ(x, y, r, c)",
        description:
          "Draws a circle outline. x,y is the centre, r is the radius in pixels.",
        example:
          "-- radar-style pulsing rings:\nfunction _draw()\n  cls(0)\n  for i = 1, 3 do\n    local r = ((time() * 20 + i * 14) % 42)\n    local alpha = 1 - r / 42\n    circ(64, 64, r, 3)\n  end\nend",
      },
      {
        name: "circfill",
        signature: "circfill(x, y, r, c)",
        description:
          "Draws a solid filled circle. x,y is the centre, r is the radius in pixels.",
        example:
          "-- pulsing glow effect:\nfunction _draw()\n  cls(0)\n  local r = 20 + sin(time() * 3) * 8\n  circfill(64, 64, r,     1)  -- dark core\n  circfill(64, 64, r - 6, 8)  -- bright centre\n  spr(0, 60, 60)              -- sprite on top\nend",
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
        name: "flr",
        signature: "flr(n)  -->  integer",
        description:
          "Returns the largest integer ≤ n (floor). Essential for pixel-perfect positions, tile coordinates, and integer frame indices from floats.",
        example:
          "-- snap position to 8px tile grid:\nlocal snap_x = flr(px / 8) * 8\nlocal snap_y = flr(py / 8) * 8\n\n-- tile coordinates from pixel position:\nlocal tile_col = flr(px / 8)\nlocal tile_row = flr(py / 8)\n\n-- random integer 0–5:\nlocal roll = flr(rnd(6))",
      },
      {
        name: "ceil",
        signature: "ceil(n)  -->  integer",
        description:
          "Returns the smallest integer ≥ n (ceiling). Useful when you need to round up — e.g. number of pages, chunks, or rows needed.",
        example:
          "-- pages needed to display a list:\nlocal items_per_page = 10\nlocal pages = ceil(#items / items_per_page)\n\n-- columns needed for a grid:\nlocal cols = ceil(total_width / cell_size)\n\nprint(pages .. \" pages\", 2, 2, 7)",
      },
      {
        name: "abs",
        signature: "abs(n)  -->  number",
        description:
          "Returns the absolute (non-negative) value of n. Useful for distance checks, speed magnitude, and symmetric ranges.",
        example:
          "-- AABB hit detection without sqrt:\nlocal dx = abs(ax - bx)\nlocal dy = abs(ay - by)\nif dx < 8 and dy < 8 then\n  on_hit()\nend\n\n-- keep speed within limit:\nif abs(vx) > max_speed then\n  vx = max_speed * (vx > 0 and 1 or -1)\nend",
      },
      {
        name: "min / max",
        signature: "min(a, b)  max(a, b)  -->  number",
        description:
          "min returns the smaller of two values; max returns the larger. Chain them for clamping, or use mid() for a one-call clamp.",
        example:
          "-- clamp speed:\nvx = max(-max_spd, min(max_spd, vx))\n\n-- approach target speed:\nlocal diff = target_vx - vx\nvx = vx + diff * min(1, 8 * dt)\n\n-- pick furthest enemy:\nlocal farthest = 0\nfor _, e in ipairs(enemies) do\n  farthest = max(farthest, dist(e))\nend",
      },
      {
        name: "mid",
        signature: "mid(a, b, c)  -->  number",
        description:
          "Returns the middle value of three numbers. Calling mid(lo, val, hi) is equivalent to clamp(val, lo, hi) — a clean one-liner to keep a value in range.",
        example:
          "-- clamp player inside screen bounds:\npx = mid(0, px, 120)\npy = mid(0, py, 112)\n\n-- clamp health between 0 and max:\nplayer.hp = mid(0, player.hp + heal, player.max_hp)\n\n-- clamp camera scroll:\ncam_x = mid(0, cam_x, map_w - 128)",
      },
      {
        name: "sin",
        signature: "sin(a)  -->  number  -- radians",
        description:
          "Sine of angle a in radians. Returns -1 to 1. Use time() as the argument to animate — produces smooth, endless oscillation without managing timers.",
        example:
          "-- vertical bobbing:\nlocal bob_y = py + sin(time() * 4) * 3\nspr(0, px, bob_y)\n\n-- shoot upward fan:\nfor i = -2, 2 do\n  local a = pi/2 + i * 0.25\n  table.insert(bullets, {\n    vx = cos(a) * 80,\n    vy = sin(a) * 80,\n  })\nend",
      },
      {
        name: "cos",
        signature: "cos(a)  -->  number  -- radians",
        description:
          "Cosine of angle a in radians. Returns -1 to 1. Combine with sin() to produce circular motion — cos gives the X component, sin gives the Y component.",
        example:
          "-- orbit an object around a point:\nlocal angle = time() * 1.5\nlocal r = 30\nlocal ox = 64 + cos(angle) * r\nlocal oy = 64 + sin(angle) * r\nspr(5, ox - 4, oy - 4)",
      },
      {
        name: "pi",
        signature: "pi  -->  3.14159…",
        description:
          "Global constant equal to π (3.14159265358979…). Use it with sin/cos for angles, circular motion, and full-rotation arithmetic.",
        example:
          "-- full circle in radians:\nlocal tau = pi * 2\n\n-- point on a circle of radius r:\nlocal angle = time() * tau / 4  -- one full rotation per 4s\nlocal x = 64 + cos(angle) * 30\nlocal y = 64 + sin(angle) * 30\ncircfill(x, y, 3, 8)",
      },
      {
        name: "atan2",
        signature: "atan2(y, x)  -->  radians",
        description:
          "Returns the angle (in radians) of the vector (x, y) from the origin. Use for aiming — pass the difference between target and source positions. Somewhat expensive; cache the result when possible.",
        example:
          "-- aim bullet towards a target:\nlocal function angle_to(ax, ay, bx, by)\n  return atan2(by - ay, bx - ax)\nend\n\nlocal a = angle_to(px, py, tx, ty)\ntable.insert(bullets, {\n  x = px, y = py,\n  vx = cos(a) * 100,\n  vy = sin(a) * 100,\n})",
      },
      {
        name: "sqrt",
        signature: "sqrt(n)  -->  number",
        description:
          "Returns the square root of n. Use for exact Euclidean distance. Somewhat expensive — avoid in tight loops; use squared distance (dx*dx + dy*dy) for comparisons instead.",
        example:
          "-- exact distance between two points:\nlocal function dist(ax, ay, bx, by)\n  local dx = bx - ax\n  local dy = by - ay\n  return sqrt(dx*dx + dy*dy)\nend\n\n-- only sqrt when actually needed:\nif dist(px, py, ex, ey) < 16 then\n  trigger_pickup()\nend",
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
          'function _draw()\n  cls(0)\n  -- ... game drawing ...\n\n  -- debug overlay (remove before release):\n  local cpu = stat(0)\n  local mem = stat(1)\n  local c   = cpu > 80 and 8 or 7\n  print("cpu " .. tostring(cpu) .. "%", 2, 2, c)\n  print("mem " .. tostring(mem) .. "b", 2, 10, 5)\nend',
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
        name: "pal",
        signature: "pal(c0, c1)",
        description:
          "Remaps every draw call that would use colour c0 to use c1 instead. Great for flash effects, team colours, or day/night palette swaps. Call pal(c, c) to reset a single colour.",
        example:
          "-- damage flash: tint sprite red for one frame:\nfunction draw_player_hit()\n  pal(7, 8)   -- white → red\n  pal(6, 8)   -- light grey → red\n  spr(0, px, py)\n  pal(7, 7)   -- reset\n  pal(6, 6)\nend",
      },
      {
        name: "palt",
        signature: "palt(c, transparent)",
        description:
          "Sets whether colour index c is drawn transparently. By default only colour 0 is transparent. Use to designate additional colours as alpha — useful for multi-layer sprites.",
        example:
          "-- make colour 2 act as a second transparent index:\npalt(0, true)   -- keep default: 0 is clear\npalt(2, true)   -- also treat 2 as clear\nspr(4, ex, ey)  -- both 0 and 2 pixels are skipped\npalt(2, false)  -- restore afterwards",
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
  const cost = api[entry.name]?.view;

  return (
    <div className="border border-rpg-gold/12 bg-surface-base overflow-hidden">
      <div className="flex gap-0 min-h-0">
        {/* Left: signature + description */}
        <div className="flex flex-col gap-2 p-3 w-64 shrink-0 border-r border-rpg-gold/10">
          <code className="font-mono text-[11px] text-rpg-gold whitespace-pre-wrap leading-relaxed">
            {entry.signature}
          </code>
          <p className="text-[11px] leading-relaxed text-rpg-stone/80 whitespace-pre-line">
            {entry.description}
          </p>
          {cost && (
            <div className="flex gap-1.5 mt-auto pt-1">
              {cost.vram != null && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-surface-raised border border-rpg-gold/12 text-[9px]">
                  <span className="text-rpg-stone/70">VRAM</span>
                  <span className="text-rpg-emerald font-mono">{cost.vram}</span>
                </span>
              )}
              {cost.instructions != null && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-surface-raised border border-rpg-gold/12 text-[9px]">
                  <span className="text-rpg-stone/70">OPS</span>
                  <span className="text-rpg-gold font-mono">{cost.instructions}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: syntax-highlighted code example */}
        <div className="flex-1 overflow-x-auto bg-surface-base">
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
              className="text-rpg-stone hover:text-rpg-gold"
            >
              <QuestionIcon size={10} />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Lua API reference</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-4xl w-full p-0 gap-0 bg-surface-card border-rpg-gold/20 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-rpg-gold/12">
          <DialogTitle className="text-sm font-semibold text-rpg-parchment">
            Lua Reference
          </DialogTitle>
          <p className="text-[11px] text-rpg-stone/70 mt-0.5">
            Language basics and built-in API for all scripts
          </p>
        </DialogHeader>

        <div className="flex" style={{ height: 560 }}>
          {/* Category sidebar */}
          <nav className="flex w-32 shrink-0 flex-col gap-px border-r border-rpg-gold/12 bg-surface-base p-2 overflow-y-auto">
            {DOCS.map((cat) => {
              const active = cat.label === activeCategory;
              return (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`relative flex items-center rounded-none px-2.5 py-1.5 text-left text-xs transition ${
                    active
                      ? "bg-rpg-gold/8 text-rpg-gold"
                      : "text-rpg-stone/70 hover:bg-rpg-gold/4 hover:text-rpg-stone"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-rpg-gold" />
                  )}
                  {cat.label}
                  <span className="ml-auto font-mono text-[9px] text-rpg-stone/50">
                    {cat.entries.length}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Entries */}
          <ScrollArea className="flex-1">
            <div className="space-y-2.5 p-4">
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/60 mb-3">
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
