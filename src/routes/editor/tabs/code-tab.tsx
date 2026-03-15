import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion, type CompletionContext, type Completion } from "@codemirror/autocomplete";
import { MatchDecorator, ViewPlugin, Decoration, EditorView, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store";
import { InlineEdit } from "../inline-edit";
import type { ScriptData } from "@/types/cartridge";
import { extractExports } from "@/lib/preprocess-lua";

// ── export keyword highlight ──────────────────────────────────────────────

const exportMark = Decoration.mark({ class: "cm-export-kw" });

const exportDecorator = new MatchDecorator({
  regexp: /\bexport\b/g,
  decoration: exportMark,
});

const exportHighlight = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = exportDecorator.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.decorations = exportDecorator.updateDeco(update, this.decorations);
    }
  },
  { decorations: (v) => v.decorations },
);


// ── API completions ───────────────────────────────────────────────────────

function mkInfo(desc: string, example: string): Completion["info"] {
  return () => {
    const wrap = document.createElement("div");
    wrap.style.cssText = "padding:6px 8px;max-width:280px;font-size:12px;line-height:1.5";

    const d = document.createElement("div");
    d.style.cssText = "color:#abb2bf;margin-bottom:6px";
    d.textContent = desc;

    const pre = document.createElement("pre");
    pre.style.cssText = "margin:0;padding:5px 7px;background:#1a1a2e;border:1px solid rgba(255,255,255,0.07);color:#e5c07b;font-family:inherit;font-size:11px;white-space:pre-wrap;word-break:break-all";
    pre.textContent = example;

    wrap.appendChild(d);
    wrap.appendChild(pre);
    return wrap;
  };
}

const LUA_API_COMPLETIONS: Completion[] = [
  // ── Drawing ──────────────────────────────────────────────────────────────
  { label: "cls",      detail: "(c)",                type: "function",
    info: mkInfo("Fill the entire screen with palette color c.", "cls(0)  -- clear to black\ncls(1)  -- clear to dark-blue") },
  { label: "pset",     detail: "(x, y, c)",          type: "function",
    info: mkInfo("Set a single pixel at (x,y) to palette color c.", "pset(64, 64, 8)  -- red dot at center") },
  { label: "pget",     detail: "(x, y)",             type: "function",
    info: mkInfo("Return the palette color index of the pixel at (x,y).", "local c = pget(64, 64)") },
  { label: "line",     detail: "(x0,y0,x1,y1,c)",   type: "function",
    info: mkInfo("Draw a line from (x0,y0) to (x1,y1) in color c.", "line(0, 0, 127, 127, 7)  -- white diagonal") },
  { label: "rect",     detail: "(x,y,w,h,c)",        type: "function",
    info: mkInfo("Draw a rectangle outline. x,y = top-left, w,h = size.", "rect(10, 10, 20, 20, 6)") },
  { label: "rectfill", detail: "(x,y,w,h,c)",        type: "function",
    info: mkInfo("Draw a filled rectangle. x,y = top-left, w,h = size.", "rectfill(0, 112, 128, 16, 3)  -- ground bar") },
  { label: "circ",     detail: "(x,y,r,c)",          type: "function",
    info: mkInfo("Draw a circle outline at (x,y) with radius r.", "circ(64, 64, 10, 7)") },
  { label: "circfill", detail: "(x,y,r,c)",          type: "function",
    info: mkInfo("Draw a filled circle at (x,y) with radius r.", "circfill(px, py, 4, 8)  -- red filled ball") },
  { label: "spr",      detail: "(n,x,y[,w,h])",      type: "function",
    info: mkInfo("Draw sprite n at (x,y). Optional w,h in sprite units (default 1).", "spr(0, px, py)        -- single sprite\nspr(0, px, py, 2, 2)  -- 2×2 sprite") },
  { label: "map",      detail: "(tx,ty,sx,sy,tw,th[,id])", type: "function",
    info: mkInfo(
      "Draw a region of a map.\n" +
      "  tx,ty  — tile offset inside the map to start reading from\n" +
      "  sx,sy  — pixel position on screen to draw at\n" +
      "  tw,th  — number of tiles to draw (width × height)\n" +
      "  id     — map index (optional, default 0)",
      "-- draw the whole first map\nmap(0, 0, 0, 0, 16, 16)\n\n-- draw with camera scroll\nmap(0, 0, -cam_x, -cam_y, 16, 16)\n\n-- draw second map at screen pos (0,0)\nmap(0, 0, 0, 0, 16, 16, 1)"
    ) },
  // ── Text ─────────────────────────────────────────────────────────────────
  { label: "print",    detail: "(str,x,y,c)",        type: "function",
    info: mkInfo("Draw text at (x,y) in color c. Omit x,y,c to print at the cursor.", 'print("score: "..score, 2, 2, 7)\nprint("hi!")  -- uses cursor position') },
  { label: "cursor",   detail: "(x,y)",              type: "function",
    info: mkInfo("Move the text cursor to (x,y) for the next print() call.", "cursor(4, 4)\nprint(\"HP: \"..hp)") },
  // ── Input ─────────────────────────────────────────────────────────────────
  { label: "btn",      detail: "(i)",                type: "function",
    info: mkInfo("Return true while button i is held. Buttons: 0=left 1=right 2=up 3=down 4=A 5=B.", "if btn(0) then x = x - 1 end\nif btn(4) then shoot() end") },
  { label: "btnp",     detail: "(i)",                type: "function",
    info: mkInfo("Return true only on the first frame button i is pressed (no repeat).", "if btnp(4) then jump() end") },
  // ── Sound ─────────────────────────────────────────────────────────────────
  { label: "sfx",      detail: "(n)",                type: "function",
    info: mkInfo("Play sound effect at index n once.", "sfx(0)  -- play first sound") },
  { label: "music",    detail: "(n)",                type: "function",
    info: mkInfo("Play music track n in a loop. Pass -1 to stop.", "music(0)   -- start looping track 0\nmusic(-1)  -- stop music") },
  // ── Math ──────────────────────────────────────────────────────────────────
  { label: "rnd",      detail: "(n)",                type: "function",
    info: mkInfo("Return a random float in [0, n).", "local x = rnd(128)     -- random x on screen\nlocal d = flr(rnd(6))+1 -- d6 roll") },
  { label: "flr",      detail: "(n)",                type: "function",
    info: mkInfo("Return the largest integer ≤ n (floor).", "local tx = flr(px / 8)  -- tile column") },
  { label: "ceil",     detail: "(n)",                type: "function",
    info: mkInfo("Return the smallest integer ≥ n (ceiling).", "local rows = ceil(count / 4)") },
  { label: "abs",      detail: "(n)",                type: "function",
    info: mkInfo("Return the absolute value of n.", "local dist = abs(ax - bx)") },
  { label: "min",      detail: "(a,b)",              type: "function",
    info: mkInfo("Return the smaller of a and b.", "x = min(x + spd, 120)  -- clamp right edge") },
  { label: "max",      detail: "(a,b)",              type: "function",
    info: mkInfo("Return the larger of a and b.", "x = max(x - spd, 0)  -- clamp left edge") },
  { label: "mid",      detail: "(a,b,c)",            type: "function",
    info: mkInfo("Return the middle value of a, b, c. Useful for clamping.", "x = mid(0, x, 120)  -- clamp x between 0 and 120") },
  { label: "sin",      detail: "(a)",                type: "function",
    info: mkInfo("Return the sine of a (radians).", "local y = 64 + sin(time()) * 20  -- bobbing motion") },
  { label: "cos",      detail: "(a)",                type: "function",
    info: mkInfo("Return the cosine of a (radians).", "local x = 64 + cos(time()) * 20") },
  { label: "atan2",    detail: "(y,x)",              type: "function",
    info: mkInfo("Return the angle in radians from origin to (x,y).", "local angle = atan2(ty - py, tx - px)") },
  { label: "sqrt",     detail: "(n)",                type: "function",
    info: mkInfo("Return the square root of n.", "local dist = sqrt((bx-ax)^2 + (by-ay)^2)") },
  // ── State ─────────────────────────────────────────────────────────────────
  { label: "time",     detail: "()",                 type: "function",
    info: mkInfo("Return seconds elapsed since the game started.", "local t = time()\nlocal wave = sin(t * 3) * 10") },
  { label: "stat",     detail: "(i)",                type: "function",
    info: mkInfo("Return a runtime stat. 0 = CPU usage %, 1 = estimated memory bytes.", "print(stat(0)..\"%\", 2, 2, 6)  -- show CPU") },
  { label: "camera",   detail: "(x,y)",              type: "function",
    info: mkInfo("Offset all subsequent drawing by (-x, -y). Call camera(0,0) to reset.", "camera(cam_x, cam_y)  -- scroll world\ncamera(0, 0)          -- reset") },
  { label: "pal",      detail: "(c0,c1)",            type: "function",
    info: mkInfo("Remap palette color c0 to draw as c1 until reset. pal(c,c) resets one slot.", "pal(8, 9)  -- draw reds as orange\npal(8, 8)  -- reset slot") },
  { label: "palt",     detail: "(c,t)",              type: "function",
    info: mkInfo("Set whether palette color c is transparent (t=true) or opaque (t=false).", "palt(0, true)   -- color 0 transparent (default)\npalt(2, true)   -- also make color 2 transparent") },
  // ── Modules ───────────────────────────────────────────────────────────────
  { label: "require",         detail: '("name")',       type: "function",
    info: mkInfo("Import another script as a module. Returns the table of exported values.", 'local utils = require("utils")\nutils.lerp(a, b, t)') },
  { label: "export function", detail: "name(...)",      type: "keyword",
    info: mkInfo("Export a function from this module so other scripts can use it via require.", "export function lerp(a, b, t)\n  return a + (b - a) * t\nend") },
  { label: "export",          detail: "NAME = value",   type: "keyword",
    info: mkInfo("Export a value from this module.", "export MAX_SPEED = 120\nexport GRAVITY   = 200") },
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  { label: "_init",    detail: "()",                 type: "function",
    info: mkInfo("Called once when the game starts. Use it to initialise state.", "function _init()\n  x, y = 64, 64\n  score = 0\nend") },
  { label: "_update",  detail: "(dt)",               type: "function",
    info: mkInfo("Called every frame. dt is delta-time in seconds — use it for frame-rate-independent movement.", "function _update(dt)\n  x = x + speed * dt\nend") },
  { label: "_draw",    detail: "()",                 type: "function",
    info: mkInfo("Called every frame after _update. Put all drawing calls here.", "function _draw()\n  cls(0)\n  spr(0, x, y)\nend") },
];


/** Build require → varname map from the current document text */
function parseRequires(doc: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of doc.matchAll(/local\s+(\w+)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    map.set(m[1], m[2]); // varname → scriptname
  }
  return map;
}

function buildCompletions(scripts: ScriptData[]) {
  return function (context: CompletionContext) {
    const doc = context.state.doc.toString();

    // ── member completion: varname.‹member› ──────────────────────────────
    const dotMatch = context.matchBefore(/[\w]+\.[\w]*/);
    if (dotMatch) {
      const [varName, memberPrefix = ""] = dotMatch.text.split(".");
      const requires = parseRequires(doc);
      const scriptName = requires.get(varName);
      if (scriptName) {
        const target = scripts.find((s) => s.name === scriptName);
        if (target) {
          const members = extractExports(target.code);
          if (members.length > 0) {
            return {
              from: dotMatch.from + varName.length + 1,
              filter: false,
              options: members
                .filter((m) => m.startsWith(memberPrefix))
                .map((m) => ({ label: m, type: "function" as const })),
            };
          }
        }
      }
      return null; // don't show generic completions after "."
    }

    // ── base completions ──────────────────────────────────────────────────
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    // Also suggest require("name") for each available module script
    const moduleOptions: Completion[] = scripts
      .filter((s) => s.id !== 0)
      .map((s) => ({
        label: `require("${s.name}")`,
        type: "function" as const,
        info: `Import module "${s.name}"`,
      }));

    return {
      from: word.from,
      options: [...LUA_API_COMPLETIONS, ...moduleOptions],
    };
  };
}

export function CodeTab() {
  const {
    activeCartridge,
    updateActiveCartridge,
    selectedScriptId,
    setSelectedScriptId,
  } = useStore();

  const scripts = activeCartridge?.scripts ?? [];

  const extensions = useMemo(
    () => [
      StreamLanguage.define(lua),
      autocompletion({ override: [buildCompletions(scripts)] }),
      exportHighlight,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scripts],
  );

  const handleChange = useCallback(
    (value: string) => {
      if (!activeCartridge) return;
      updateActiveCartridge({
        scripts: activeCartridge.scripts.map((s) =>
          s.id === selectedScriptId ? { ...s, code: value } : s,
        ),
      });
    },
    [activeCartridge, selectedScriptId, updateActiveCartridge],
  );

  if (!activeCartridge) return null;
  const activeScript = scripts.find((s) => s.id === selectedScriptId) ?? scripts[0];

  function addScript() {
    if (!activeCartridge) return;
    const newId = activeCartridge.scripts.length;
    const newScripts = [
      ...activeCartridge.scripts,
      { id: newId, name: `script_${newId}`, code: `-- script_${newId}\n` },
    ];
    updateActiveCartridge({ scripts: newScripts });
    setSelectedScriptId(newId);
  }

  function deleteScript(id: number) {
    if (!activeCartridge || scripts.length <= 1) return;
    const newScripts = scripts
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, id: i }));
    updateActiveCartridge({ scripts: newScripts });
    if (selectedScriptId >= newScripts.length) setSelectedScriptId(newScripts.length - 1);
    else if (selectedScriptId === id) setSelectedScriptId(Math.max(0, id - 1));
  }

  function commitRename(id: number, name: string) {
    if (!activeCartridge) return;
    updateActiveCartridge({
      scripts: scripts.map((s) =>
        s.id === id ? { ...s, name: name.trim() || `script_${id}` } : s,
      ),
    });
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Script list */}
      <div className="flex w-44 shrink-0 flex-col border-r border-white/8">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            Scripts
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={addScript}
            className="text-zinc-500 hover:text-zinc-300"
            title="Add script"
          >
            <PlusIcon size={10} />
          </Button>
        </div>

        <Separator className="bg-white/8" />

        <ScrollArea className="flex-1">
          <div className="flex w-44 flex-col gap-px overflow-x-hidden p-1.5">
            {scripts.map((s) => {
              const active = s.id === (activeScript?.id ?? 0);
              return (
                <div
                  key={s.id}
                  className={`group relative flex items-center gap-1.5 border px-1.5 py-1 transition ${
                    active
                      ? "border-violet-500/40 bg-violet-600/10"
                      : "border-transparent hover:border-white/8 hover:bg-white/4"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-violet-500" />
                  )}

                  <button
                    className={`shrink-0 font-mono text-[9px] ${
                      active ? "text-violet-400" : "text-zinc-700"
                    }`}
                    onClick={() => setSelectedScriptId(s.id)}
                  >
                    #{s.id}
                  </button>

                  <div
                    className="flex min-w-0 flex-1 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedScriptId(s.id)}
                  >
                    <InlineEdit
                      value={s.name}
                      onCommit={(name) => commitRename(s.id, name)}
                      emptyLabel={`script_${s.id}`}
                      className={`text-xs ${active ? "text-zinc-200" : "text-zinc-400"}`}
                    />
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); deleteScript(s.id); }}
                    disabled={scripts.length <= 1}
                    className="flex h-5 w-5 shrink-0 items-center justify-center text-zinc-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100 disabled:opacity-20"
                  >
                    <TrashIcon size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Separator className="bg-white/8" />

        <div className="shrink-0 px-3 py-2">
          <p className="text-[9px] leading-relaxed text-zinc-700">
            Script <span className="text-zinc-500">#0</span> runs as entry point.<br />
            Others load via <span className="font-mono text-zinc-500">require("name")</span>.
          </p>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeScript && (
          <CodeMirror
            key={activeScript.id}
            value={activeScript.code}
            height="100%"
            theme={oneDark}
            extensions={extensions}
            onChange={handleChange}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              autocompletion: false,
            }}
            style={{ height: "100%", fontSize: "13px" }}
          />
        )}
      </div>
    </div>
  );
}
