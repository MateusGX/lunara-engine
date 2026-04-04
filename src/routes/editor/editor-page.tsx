import { useEffect, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams } from "react-router-dom";
import {
  CodeIcon,
  PaletteIcon,
  GridFourIcon,
  MusicNoteIcon,
  SlidersIcon,
  TerminalIcon,
  TrashIcon,
  CaretDownIcon,
  CaretUpIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@/store";
import { get as getCartridge } from "@/db/cartridge-repository";
import { EditorTab } from "@/types/editor";
import type { ConsoleMessage } from "@/types/editor";
import type { Cartridge } from "@/types/cartridge";
import { EditorToolbar } from "./editor-toolbar";
import { CodeTab } from "./tabs/code-tab";
import { SpriteTab } from "./tabs/sprite-tab";
import { MapTab } from "./tabs/map-tab";
import { SoundTab } from "./tabs/sound-tab";
import { SettingsTab } from "./tabs/settings-tab";
import { calcStorageBytes } from "@/cartridge/export";
import { useRunner } from "@/hooks/use-runner";

const NAV_TABS = [
  { id: EditorTab.Code,   icon: CodeIcon,       label: "Code"    },
  { id: EditorTab.Sprite, icon: PaletteIcon,    label: "Sprites" },
  { id: EditorTab.Map,    icon: GridFourIcon,   label: "Map"     },
  { id: EditorTab.Sound,  icon: MusicNoteIcon,  label: "Sounds"  },
];
const SETTINGS_TAB = {
  id: EditorTab.Settings,
  icon: SlidersIcon,
  label: "Settings",
};

function TabContent({ tab }: { tab: EditorTab }) {
  switch (tab) {
    case EditorTab.Code:     return <CodeTab />;
    case EditorTab.Sprite:   return <SpriteTab />;
    case EditorTab.Map:      return <MapTab />;
    case EditorTab.Sound:    return <SoundTab />;
    case EditorTab.Settings: return <SettingsTab />;
    default:                 return null;
  }
}

const CONSOLE_HEIGHT = 180;

// ── ResourceBar ───────────────────────────────────────────────────────────────

function ResourceBar({ label, pct, fmt }: { label: string; pct: number; fmt: string }) {
  const color =
    pct > 80 ? "bg-rpg-blood" : pct > 50 ? "bg-yellow-500" : "bg-rpg-emerald";
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 font-mono text-[10px] font-medium text-rpg-stone/80">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden bg-rpg-gold/8">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-[10px] text-rpg-stone/70">{fmt}</span>
    </div>
  );
}

// ── EditorPage ────────────────────────────────────────────────────────────────

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const {
    activeCartridge,
    setActiveCartridge,
    saveActiveCartridge,
    activeTab,
    setActiveTab,
    previewVisible,
    messages,
    clearMessages,
    consoleOpen,
    setConsoleOpen,
  } = useStore();

  const { start, stop, runnerRef, crashMessage } = useRunner();
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consolBottomRef = useRef<HTMLDivElement>(null);
  const [cpu, setCpu] = useState(0);
  const [mem, setMem] = useState(0);

  useEffect(() => { clearMessages(); }, [clearMessages]);

  useEffect(() => {
    if (!id) return;
    getCartridge(id).then((cart: Cartridge | undefined) => {
      if (cart) setActiveCartridge(cart);
    });
  }, [id, setActiveCartridge]);

  useEffect(() => {
    if (!activeCartridge) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveActiveCartridge(); }, 1000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [activeCartridge, saveActiveCartridge]);

  useEffect(() => {
    consolBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.type === "error") setConsoleOpen(true);
  }, [messages, setConsoleOpen]);

  const handleRun = useCallback(async () => {
    if (!activeCartridge) return;
    if (!previewVisible) {
      flushSync(() => useStore.getState().setPreviewVisible(true));
    }
    if (!previewCanvasRef.current) return;
    await start(activeCartridge, previewCanvasRef.current);
    if (runnerRef.current) {
      runnerRef.current.onStats = (c: number, m: number) => {
        setCpu(c);
        setMem(m);
      };
    }
  }, [activeCartridge, previewVisible, start, runnerRef]);

  const handleStop = useCallback(() => {
    stop();
    setCpu(0);
    setMem(0);
    const canvas = previewCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }
  }, [stop]);

  const errorCount = messages.filter((m: ConsoleMessage) => m.type === "error").length;

  const typeColors: Record<string, string> = {
    log:   "text-rpg-stone/80",
    error: "text-rpg-blood",
    warn:  "text-yellow-400",
    info:  "text-blue-400",
  };

  if (!activeCartridge) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base text-rpg-stone">
        <span className="font-mono text-xs tracking-widest animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorToolbar onRun={handleRun} onStop={handleStop} cpu={cpu} mem={mem} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar — Dungeon Navigation ── */}
        <aside className="flex w-15 shrink-0 flex-col border-r border-rpg-gold/12 bg-surface-raised">
          <nav className="flex flex-1 flex-col py-1">
            {NAV_TABS.map(({ id: tabId, icon: Icon, label }) => {
              const active = activeTab === tabId;
              return (
                <Tooltip key={tabId}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => setActiveTab(tabId)}
                      className={`relative h-auto w-full flex-col items-center gap-1 rounded-none border-0 py-3 transition ${
                        active
                          ? "bg-rpg-gold/8 text-rpg-gold"
                          : "text-rpg-stone/70 hover:bg-rpg-gold/4 hover:text-rpg-parchment"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-0 left-0 w-0.75 bg-rpg-gold" />
                      )}
                      <Icon size={20} weight={active ? "fill" : "regular"} />
                      <span className="text-[9px] font-medium tracking-wide">{label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="border-rpg-gold/20 bg-surface-overlay text-rpg-parchment text-xs">
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="h-px bg-rpg-gold/12" />

          {/* Settings pinned to bottom */}
          <div className="pb-1">
            {(() => {
              const { id: tabId, icon: Icon, label } = SETTINGS_TAB;
              const active = activeTab === tabId;
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => setActiveTab(tabId)}
                      className={`relative h-auto w-full flex-col items-center gap-1 rounded-none border-0 py-3 transition ${
                        active
                          ? "bg-rpg-gold/8 text-rpg-gold"
                          : "text-rpg-stone/70 hover:bg-rpg-gold/4 hover:text-rpg-parchment"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-0 left-0 w-0.75 bg-rpg-gold" />
                      )}
                      <Icon size={20} weight={active ? "fill" : "regular"} />
                      <span className="text-[9px] font-medium tracking-wide">{label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="border-rpg-gold/20 bg-surface-overlay text-rpg-parchment text-xs">
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            })()}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              <TabContent tab={activeTab} />
            </div>

            {/* ── Scrying Glass (preview) ── */}
            {previewVisible && (
              <div className="flex w-72 shrink-0 flex-col items-center gap-3 border-l border-rpg-gold/12 bg-surface-base p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-rpg-gold/60">
                    Preview
                  </span>
                </div>

                <div className="relative w-full" style={{ maxWidth: "256px" }}>
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      imageRendering: "pixelated",
                      width: "100%",
                      aspectRatio: `${activeCartridge.hardware.width} / ${activeCartridge.hardware.height}`,
                      border: "1px solid oklch(0.68 0.22 300 / 20%)",
                      background: "#000",
                      display: "block",
                    }}
                  />
                  {/* Scrying glass corner ornaments */}
                  <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-rpg-gold/50" />
                  <span className="pointer-events-none absolute top-0 right-0 h-2.5 w-2.5 border-t border-r border-rpg-gold/50" />
                  <span className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-rpg-gold/50" />
                  <span className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-rpg-gold/50" />

                  {crashMessage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
                      <p className="mb-1 font-mono text-sm font-bold text-rpg-blood">
                        💥 CRASH
                      </p>
                      <p className="px-2 text-center font-mono text-xs text-rpg-blood/80 break-all">
                        {crashMessage}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-center font-mono text-[10px] text-rpg-stone/60">
                  {activeCartridge.hardware.width}×{activeCartridge.hardware.height}{" "}
                  · {activeCartridge.hardware.palette.length} colors
                </p>

                {/* Resource usage bars */}
                <div className="w-full space-y-1.5">
                  <ResourceBar label="CPU" pct={cpu} fmt={`${Math.round(cpu)}%`} />
                  <ResourceBar
                    label="MEM"
                    pct={
                      activeCartridge.hardware.maxMemBytes > 0
                        ? Math.min(100, (mem / activeCartridge.hardware.maxMemBytes) * 100)
                        : 0
                    }
                    fmt={mem >= 1024 ? `${(mem / 1024).toFixed(1)}k` : `${mem}b`}
                  />
                  <div className="my-1 border-t border-rpg-gold/8" />
                  <ResourceBar
                    label="SPR"
                    pct={Math.min(100, (activeCartridge.sprites.length / activeCartridge.hardware.maxSprites) * 100)}
                    fmt={`${activeCartridge.sprites.length}/${activeCartridge.hardware.maxSprites}`}
                  />
                  <ResourceBar
                    label="SND"
                    pct={Math.min(100, (activeCartridge.sounds.length / activeCartridge.hardware.maxSounds) * 100)}
                    fmt={`${activeCartridge.sounds.length}/${activeCartridge.hardware.maxSounds}`}
                  />
                  <ResourceBar
                    label="STG"
                    pct={(() => {
                      const used = calcStorageBytes(activeCartridge);
                      const limit = activeCartridge.hardware.maxStorageBytes ?? 512 * 1024;
                      return Math.min(100, (used / limit) * 100);
                    })()}
                    fmt={(() => {
                      const used = calcStorageBytes(activeCartridge);
                      return used >= 1024 * 1024
                        ? `${(used / (1024 * 1024)).toFixed(1)}M`
                        : used >= 1024
                          ? `${(used / 1024).toFixed(1)}k`
                          : `${used}b`;
                    })()}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Oracle (Console) ── */}
          <div className="shrink-0 border-t border-rpg-gold/12">
            <div
              className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-rpg-gold/4 transition"
              onClick={() => setConsoleOpen(!consoleOpen)}
            >
              <TerminalIcon size={14} className="text-rpg-gold/60" />
              <span className="text-xs font-semibold uppercase tracking-wider text-rpg-gold/70">
                Console
              </span>
              {errorCount > 0 && (
                <Badge
                  variant="destructive"
                  className="flex h-4 min-w-4 items-center justify-center px-1 font-mono text-[9px]"
                >
                  {Math.min(9, errorCount)}
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                {consoleOpen && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearMessages();
                    }}
                    className="h-5 gap-1 px-1.5 text-[10px] text-rpg-stone/60 hover:text-rpg-blood"
                  >
                    <TrashIcon size={10} /> Clear
                  </Button>
                )}
                {consoleOpen ? (
                  <CaretDownIcon size={13} className="text-rpg-stone/50" />
                ) : (
                  <CaretUpIcon size={13} className="text-rpg-stone/50" />
                )}
              </div>
            </div>

            {consoleOpen && (
              <ScrollArea
                style={{ height: CONSOLE_HEIGHT }}
                className="border-t border-rpg-gold/8 bg-surface-base"
              >
                <div className="p-3 font-mono text-xs">
                  {messages.length === 0 ? (
                    <p className="italic text-rpg-stone/50">
                      No output. Run your game to see logs here.
                    </p>
                  ) : (
                    messages.map((m: ConsoleMessage) => (
                      <div
                        key={m.id}
                        className={`leading-5 ${typeColors[m.type] ?? "text-rpg-parchment"}`}
                      >
                        {m.type !== "log" && (
                          <span className="mr-1.5 font-bold uppercase opacity-70">
                            [{m.type}]
                          </span>
                        )}
                        {m.text}
                      </div>
                    ))
                  )}
                  <div ref={consolBottomRef} />
                </div>
              </ScrollArea>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
