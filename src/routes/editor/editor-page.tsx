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
import { Separator } from "@/components/ui/separator";
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
import { calcStorageBytes } from "@/lib/export-lun";
import { useRunner } from "@/hooks/use-runner";
import type { Diagnostic } from "@codemirror/lint";

const NAV_TABS = [
  { id: EditorTab.Code, icon: CodeIcon, label: "Code" },
  { id: EditorTab.Sprite, icon: PaletteIcon, label: "Sprites" },
  { id: EditorTab.Map, icon: GridFourIcon, label: "Map" },
  { id: EditorTab.Sound, icon: MusicNoteIcon, label: "Sounds" },
];
const SETTINGS_TAB = {
  id: EditorTab.Settings,
  icon: SlidersIcon,
  label: "Settings",
};

function TabContent({ tab }: { tab: EditorTab }) {
  switch (tab) {
    case EditorTab.Code:
      return <CodeTab />;
    case EditorTab.Sprite:
      return <SpriteTab />;
    case EditorTab.Map:
      return <MapTab />;
    case EditorTab.Sound:
      return <SoundTab />;
    case EditorTab.Settings:
      return <SettingsTab />;
    default:
      return null;
  }
}

const CONSOLE_HEIGHT = 180;

function ResourceBar({
  label,
  pct,
  fmt,
}: {
  label: string;
  pct: number;
  fmt: string;
}) {
  const color =
    pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 font-mono text-[9px] text-zinc-600">{label}</span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/6">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[9px] text-zinc-500">
        {fmt}
      </span>
    </div>
  );
}

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

  // Clear console on mount so messages from launcher/player don't bleed in
  useEffect(() => {
    clearMessages();
  }, [clearMessages]);

  // Load cartridge from idb
  useEffect(() => {
    if (!id) return;
    getCartridge(id).then((cart: Cartridge | undefined) => {
      if (cart) setActiveCartridge(cart);
    });
  }, [id, setActiveCartridge]);

  // Debounced auto-save
  useEffect(() => {
    if (!activeCartridge) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveActiveCartridge();
    }, 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [activeCartridge, saveActiveCartridge]);

  // Auto-scroll console to bottom on new messages
  useEffect(() => {
    consolBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Open console automatically on new errors
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
    // Clear the game canvas
    const canvas = previewCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [stop]);

  const errorCount = messages.filter(
    (m: ConsoleMessage) => m.type === "error",
  ).length;

  const typeColors: Record<string, string> = {
    log: "text-zinc-300",
    error: "text-red-400",
    warn: "text-yellow-400",
    info: "text-blue-400",
  };

  if (!activeCartridge) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0d14] text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorToolbar
        onRun={handleRun}
        onStop={handleStop}
        cpu={cpu}
        mem={mem}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-14 shrink-0 flex-col border-r border-white/8">
          {/* Nav tabs */}
          <nav className="flex flex-1 flex-col py-1">
            {NAV_TABS.map(({ id: tabId, icon: Icon, label }) => {
              const active = activeTab === tabId;
              return (
                <Tooltip key={tabId}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(tabId)}
                      className={`relative flex w-full flex-col items-center gap-0.5 py-2.5 transition ${
                        active
                          ? "text-violet-300"
                          : "text-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-0 left-0 w-0.5 bg-violet-500" />
                      )}
                      <Icon size={17} weight={active ? "fill" : "regular"} />
                      <span className="text-[9px] font-medium tracking-wide">
                        {label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <Separator className="bg-white/8" />

          {/* Settings pinned to bottom */}
          <div className="pb-1">
            {(() => {
              const { id: tabId, icon: Icon, label } = SETTINGS_TAB;
              const active = activeTab === tabId;
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(tabId)}
                      className={`relative flex w-full flex-col items-center gap-0.5 py-2.5 transition ${
                        active
                          ? "text-violet-300"
                          : "text-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-0 left-0 w-0.5 bg-violet-500" />
                      )}
                      <Icon size={17} weight={active ? "fill" : "regular"} />
                      <span className="text-[9px] font-medium tracking-wide">
                        {label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            })()}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Tab + Preview */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              <TabContent tab={activeTab} />
            </div>

            {/* Preview pane */}
            {previewVisible && (
              <div className="flex w-72 shrink-0 flex-col items-center gap-3 border-l border-white/8 bg-[#0a0a12] p-4">
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Preview
                </span>
                <div className="relative w-full" style={{ maxWidth: "256px" }}>
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      imageRendering: "pixelated",
                      width: "100%",
                      aspectRatio: `${activeCartridge.hardware.width} / ${activeCartridge.hardware.height}`,
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      background: "#000",
                      display: "block",
                    }}
                  />
                  {crashMessage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/85 backdrop-blur-sm">
                      <p className="mb-1 font-mono text-xs font-bold text-red-400">
                        CRASH
                      </p>
                      <p className="px-2 text-center font-mono text-[10px] text-red-300/70 break-all">
                        {crashMessage}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-center font-mono text-[10px] text-zinc-700">
                  {activeCartridge.hardware.width}×
                  {activeCartridge.hardware.height} ·{" "}
                  {activeCartridge.hardware.palette.length} colors
                </p>

                {/* Resource usage bars */}
                <div className="w-full space-y-1.5">
                  <ResourceBar
                    label="CPU"
                    pct={cpu}
                    fmt={`${Math.round(cpu)}%`}
                  />
                  <ResourceBar
                    label="MEM"
                    pct={
                      activeCartridge.hardware.maxMemBytes > 0
                        ? Math.min(
                            100,
                            (mem / activeCartridge.hardware.maxMemBytes) * 100,
                          )
                        : 0
                    }
                    fmt={
                      mem >= 1024 ? `${(mem / 1024).toFixed(1)}k` : `${mem}b`
                    }
                  />

                  <div className="my-1 border-t border-white/5" />

                  <ResourceBar
                    label="SPR"
                    pct={Math.min(
                      100,
                      (activeCartridge.sprites.length /
                        activeCartridge.hardware.maxSprites) *
                        100,
                    )}
                    fmt={`${activeCartridge.sprites.length}/${activeCartridge.hardware.maxSprites}`}
                  />
                  <ResourceBar
                    label="SND"
                    pct={Math.min(
                      100,
                      (activeCartridge.sounds.length /
                        activeCartridge.hardware.maxSounds) *
                        100,
                    )}
                    fmt={`${activeCartridge.sounds.length}/${activeCartridge.hardware.maxSounds}`}
                  />
                  <ResourceBar
                    label="STG"
                    pct={(() => {
                      const used = calcStorageBytes(activeCartridge);
                      const limit =
                        activeCartridge.hardware.maxStorageBytes ?? 512 * 1024;
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

          {/* Bottom Console Panel */}
          <div className="shrink-0 border-t border-white/8">
            {/* Toggle header */}
            <div className="flex justify-between items-center pr-2">
              <Button
                variant="ghost"
                onClick={() => setConsoleOpen(!consoleOpen)}
              >
                <TerminalIcon size={13} />
                <span className="text-xs font-medium">Console</span>
                {errorCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="flex h-4 min-w-4 items-center justify-center px-1 font-mono text-[9px]"
                  >
                    {Math.min(9, errorCount)}
                  </Badge>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {consoleOpen ? (
                    <CaretDownIcon size={12} />
                  ) : (
                    <CaretUpIcon size={12} />
                  )}
                </div>
              </Button>
              {consoleOpen && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearMessages();
                  }}
                  className="h-5 gap-1 px-1.5 text-[10px] text-zinc-600 hover:text-zinc-300"
                >
                  <TrashIcon size={10} /> Clear
                </Button>
              )}
            </div>

            {/* Console body */}
            {consoleOpen && (
              <ScrollArea
                style={{ height: CONSOLE_HEIGHT }}
                className="border-t border-white/6 bg-[#09090f]"
              >
                <div className="p-3 font-mono text-xs">
                  {messages.length === 0 ? (
                    <p className="text-zinc-700">
                      No output. Run your game to see logs here.
                    </p>
                  ) : (
                    messages.map((m: ConsoleMessage) => (
                      <div
                        key={m.id}
                        className={`leading-5 ${typeColors[m.type] ?? "text-zinc-300"}`}
                      >
                        {m.type !== "log" && (
                          <span className="mr-1 uppercase opacity-50">
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
