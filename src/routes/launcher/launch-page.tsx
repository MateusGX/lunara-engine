import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  UploadSimpleIcon,
  GameControllerIcon,
  PlayIcon,
  MonitorIcon,
  PaletteIcon,
  StackIcon,
  MusicNoteIcon,
  WarningCircleIcon,
  FileIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LunaraLogo } from "@/components/lunara-logo";
import { CartridgeScreen } from "@/routes/player/cartridge-screen";
import type { Cartridge } from "@/types/cartridge";

function parseLunx(text: string): Cartridge {
  let json = text.trim();
  try {
    json = decodeURIComponent(atob(json));
  } catch {
    // plain JSON
  }
  const data = JSON.parse(json);
  if (!data.meta || !data.hardware || (!data.scripts && !data.code)) {
    throw new Error("Invalid cartridge file");
  }
  if (!data.scripts && data.code) {
    data.scripts = [{ id: 0, name: "main", code: data.code }];
    delete data.code;
  }
  if (!data.meta.description) data.meta.description = "";
  if (!data.meta.version) data.meta.version = "1.0.0";
  if (!data.meta.created) data.meta.created = Date.now();
  if (!data.meta.updated) data.meta.updated = Date.now();
  return data as Cartridge;
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon size={12} className="shrink-0 text-zinc-600" />
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="ml-auto font-mono text-xs text-zinc-300">{value}</span>
    </div>
  );
}

export function LaunchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cartridge, setCartridge] = useState<Cartridge | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function loadFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      setCartridge(parseLunx(text));
      setPlaying(false);
    } catch {
      setError("Could not read cartridge. Make sure it's a valid .lunx or .lun file.");
    }
  }

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, []);

  // ── Playing state ─────────────────────────────────────────────────────────
  if (cartridge && playing) {
    return (
      <div className="group/player flex h-screen flex-col bg-black">
        <div className="flex items-center justify-between px-4 py-2 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPlaying(false)}
            className="gap-1.5 text-zinc-500 hover:text-zinc-200"
          >
            <ArrowLeftIcon size={13} /> Back
          </Button>
          <div className="w-16" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <CartridgeScreen cartridge={cartridge} />
        </div>

        <div className="flex items-center gap-4 border-t border-white/5 px-5 py-2.5 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100">
          <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
            <span className="truncate text-sm font-semibold text-zinc-200">
              {cartridge.meta.name}
            </span>
            {cartridge.meta.version && (
              <Badge variant="outline" className="shrink-0 border-white/10 bg-transparent px-1 py-0 font-mono text-[9px] text-zinc-500">
                v{cartridge.meta.version}
              </Badge>
            )}
            {cartridge.meta.author && (
              <>
                <span className="shrink-0 text-zinc-700">·</span>
                <span className="shrink-0 text-xs text-zinc-500">{cartridge.meta.author}</span>
              </>
            )}
          </div>
          <span className="shrink-0 font-mono text-[10px] text-zinc-700">
            {cartridge.hardware.width}×{cartridge.hardware.height}
          </span>
        </div>
      </div>
    );
  }

  // ── Cartridge info ────────────────────────────────────────────────────────
  if (cartridge) {
    const palette = cartridge.hardware.palette;
    const totalCode = cartridge.scripts.reduce((s, sc) => s + sc.code.length, 0);

    return (
      <div className="flex min-h-screen flex-col bg-[#0d0d14] text-white">
        <header className="border-b border-white/8 px-6 py-3">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <LunaraLogo subtitle="launcher" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCartridge(null)}
              className="h-8 gap-1.5 text-xs text-zinc-500 hover:text-zinc-200"
            >
              <ArrowLeftIcon size={13} /> Load another
            </Button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-lg">
            <Card className="overflow-hidden border-white/10 bg-[#13131f] p-0">
              {/* Cover */}
              <div className="relative h-40 w-full overflow-hidden bg-[#0d0d14]">
                {cartridge.meta.coverArt ? (
                  <img
                    src={cartridge.meta.coverArt}
                    alt="Cover"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${palette[1] ?? "#1D2B53"}55 0%, ${palette[Math.min(8, palette.length - 1)] ?? "#FF004D"}22 100%)`,
                    }}
                  />
                )}
                {/* Palette strip */}
                <div className="absolute bottom-0 left-0 right-0 flex h-1">
                  {palette.slice(0, 8).map((hex, i) => (
                    <div key={i} className="flex-1" style={{ background: hex }} />
                  ))}
                </div>
                <span className="absolute left-2.5 top-2.5 bg-black/50 px-1.5 py-0.5 font-mono text-[9px] text-white/40 backdrop-blur-sm">
                  {cartridge.hardware.width}×{cartridge.hardware.height}
                </span>
              </div>

              <CardContent className="px-5 pt-4 pb-0">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold text-white">
                      {cartridge.meta.name}
                    </h1>
                    <p className="text-xs text-zinc-500">
                      {cartridge.meta.author ? `by ${cartridge.meta.author}` : "Unknown author"}
                    </p>
                  </div>
                  {cartridge.meta.version && (
                    <Badge
                      variant="outline"
                      className="mt-0.5 shrink-0 border-white/10 bg-white/5 px-1.5 font-mono text-[10px] text-zinc-400"
                    >
                      v{cartridge.meta.version}
                    </Badge>
                  )}
                </div>

                {cartridge.meta.description && (
                  <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                    {cartridge.meta.description}
                  </p>
                )}

                <Separator className="my-3 bg-white/8" />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-x-6 divide-y-0">
                  <StatRow
                    icon={MonitorIcon}
                    label="Resolution"
                    value={`${cartridge.hardware.width}×${cartridge.hardware.height}`}
                  />
                  <StatRow
                    icon={PaletteIcon}
                    label="Colors"
                    value={`${cartridge.hardware.palette.length}`}
                  />
                  <StatRow
                    icon={StackIcon}
                    label="Sprites"
                    value={`${cartridge.sprites.length}`}
                  />
                  <StatRow
                    icon={MusicNoteIcon}
                    label="Sounds"
                    value={`${cartridge.sounds.length}`}
                  />
                  <StatRow
                    icon={FileIcon}
                    label="Scripts"
                    value={`${cartridge.scripts.length}`}
                  />
                  <StatRow
                    icon={FileIcon}
                    label="Code"
                    value={totalCode > 999 ? `${(totalCode / 1000).toFixed(1)}k chars` : `${totalCode} chars`}
                  />
                </div>
              </CardContent>

              <CardFooter className="mt-4 flex-col gap-2 border-t border-white/8 px-5 py-4">
                <Button
                  size="lg"
                  onClick={() => setPlaying(true)}
                  className="w-full gap-2 bg-violet-600 font-semibold hover:bg-violet-500"
                >
                  <PlayIcon size={16} weight="fill" /> Play
                </Button>
                <p className="text-center text-[10px] text-zinc-700">
                  Played in memory — nothing is saved to disk.
                </p>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d14] text-white">
      <header className="border-b border-white/8 px-6 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <LunaraLogo subtitle="launcher" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="h-8 gap-1.5 text-xs text-zinc-500 hover:text-zinc-200"
          >
            <ArrowLeftIcon size={13} /> Projects
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Drop area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-6 border-2 border-dashed px-8 py-16 transition ${
              dragging
                ? "border-violet-500 bg-violet-500/8"
                : "border-white/10 hover:border-violet-500/30 hover:bg-violet-500/4"
            }`}
          >
            <div className={`flex h-16 w-16 items-center justify-center border transition ${
              dragging ? "border-violet-500/50 bg-violet-500/20" : "border-white/10 bg-white/4"
            }`}>
              <GameControllerIcon
                size={32}
                className={dragging ? "text-violet-400" : "text-zinc-600"}
                weight="duotone"
              />
            </div>

            <div className="text-center">
              <p className="font-semibold text-zinc-200">
                {dragging ? "Release to load" : "Drop a cartridge here"}
              </p>
              <p className="mt-1.5 text-xs text-zinc-600">
                Accepts{" "}
                <span className="font-mono text-zinc-400">.lunx</span>
                {" "}and{" "}
                <span className="font-mono text-zinc-400">.lun</span> files
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/10 bg-transparent text-zinc-400 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              <UploadSimpleIcon size={13} /> Browse file
            </Button>

            <input
              ref={inputRef}
              type="file"
              accept=".lunx,.lun,.json"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-start gap-2.5 border border-red-500/20 bg-red-500/8 px-4 py-3">
              <WarningCircleIcon size={14} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <p className="mt-5 text-center text-[11px] text-zinc-700">
            Cartridges run in memory — nothing is saved to disk.
          </p>
        </div>
      </main>
    </div>
  );
}
