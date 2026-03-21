import { useRef, useState, useCallback, useMemo } from "react";
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
  CircuitryIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LunaraLogo } from "@/components/lunara-logo";
import { CartridgeScreen } from "@/routes/player/cartridge-screen";
import { HARDWARE_PRESETS } from "@/lib/hardware-presets";
import { useCustomPresets } from "@/hooks/use-custom-presets";
import type { Cartridge, HardwareConfig } from "@/types/cartridge";

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
  const [selectedPreset, setSelectedPreset] = useState<string>("cartridge");
  const { presets: customPresets } = useCustomPresets();
  const [customFields, setCustomFields] = useState({
    width: "128",
    height: "128",
    fps: "30",
    ips: "8",
    ipsUnit: "MIPS" as "IPS" | "KIPS" | "MIPS",
    mem: "2",
    memUnit: "MB" as "KB" | "MB",
    storage: "512",
    storageUnit: "KB" as "KB" | "MB",
    sprites: "64",
    sounds: "32",
    spriteSize: "8",
    sfxSteps: "16",
  });

  const hwOverride = useMemo((): HardwareConfig | null => {
    if (selectedPreset === "cartridge" || !cartridge) return null;
    if (selectedPreset === "custom") {
      const ipsM =
        customFields.ipsUnit === "MIPS"
          ? 1_000_000
          : customFields.ipsUnit === "KIPS"
            ? 1_000
            : 1;
      const memM = customFields.memUnit === "MB" ? 1024 * 1024 : 1024;
      const storageM = customFields.storageUnit === "MB" ? 1024 * 1024 : 1024;
      return {
        ...cartridge.hardware,
        width: Math.max(
          1,
          parseInt(customFields.width) || cartridge.hardware.width,
        ),
        height: Math.max(
          1,
          parseInt(customFields.height) || cartridge.hardware.height,
        ),
        maxFps: Math.max(
          1,
          parseInt(customFields.fps) || cartridge.hardware.maxFps,
        ),
        maxIps: Math.max(1, parseFloat(customFields.ips) || 1) * ipsM,
        maxMemBytes: Math.max(1024, parseFloat(customFields.mem) || 1) * memM,
        maxStorageBytes:
          Math.max(1024, parseFloat(customFields.storage) || 1) * storageM,
        maxSprites: Math.max(
          1,
          parseInt(customFields.sprites) || cartridge.hardware.maxSprites,
        ),
        maxSounds: Math.max(
          1,
          parseInt(customFields.sounds) || cartridge.hardware.maxSounds,
        ),
        spriteSize:
          parseInt(customFields.spriteSize) ||
          (cartridge.hardware.spriteSize ?? 8),
        sfxSteps:
          parseInt(customFields.sfxSteps) ||
          (cartridge.hardware.sfxSteps ?? 16),
      };
    }
    return (
      HARDWARE_PRESETS.find((p) => p.id === selectedPreset)?.hw ??
      customPresets.find((p) => p.id === selectedPreset)?.hw ??
      null
    );
  }, [selectedPreset, customFields, cartridge, customPresets]);

  const downgradeError = useMemo((): string | null => {
    if (!hwOverride || !cartridge) return null;
    const sz = hwOverride.spriteSize ?? 8;
    const spriteConflict = cartridge.sprites.find(
      (s) => s.width > sz || s.height > sz,
    );
    if (spriteConflict)
      return `Sprite #${spriteConflict.id} is ${spriteConflict.width}×${spriteConflict.height} — larger than the preset's sprite size (${sz}px).`;
    const steps = hwOverride.sfxSteps ?? 16;
    const soundConflict = cartridge.sounds.find((s) => s.steps > steps);
    if (soundConflict)
      return `"${soundConflict.name}" has ${soundConflict.steps} steps — more than the preset's SFX steps (${steps}).`;
    return null;
  }, [hwOverride, cartridge]);

  async function loadFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      setCartridge(parseLunx(text));
      setPlaying(false);
      setSelectedPreset("cartridge");
    } catch {
      setError(
        "Could not read cartridge. Make sure it's a valid .lunx or .lun file.",
      );
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
          <CartridgeScreen
            cartridge={
              hwOverride ? { ...cartridge, hardware: hwOverride } : cartridge
            }
          />
        </div>

        <div className="flex items-center gap-4 border-t border-white/5 px-5 py-2.5 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100">
          <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
            <span className="truncate text-sm font-semibold text-zinc-200">
              {cartridge.meta.name}
            </span>
            {cartridge.meta.version && (
              <Badge
                variant="outline"
                className="shrink-0 border-white/10 bg-transparent px-1 py-0 font-mono text-[9px] text-zinc-500"
              >
                v{cartridge.meta.version}
              </Badge>
            )}
            {cartridge.meta.author && (
              <>
                <span className="shrink-0 text-zinc-700">·</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {cartridge.meta.author}
                </span>
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
    const totalCode = cartridge.scripts.reduce(
      (s, sc) => s + sc.code.length,
      0,
    );

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
                    <div
                      key={i}
                      className="flex-1"
                      style={{ background: hex }}
                    />
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
                      {cartridge.meta.author
                        ? `by ${cartridge.meta.author}`
                        : "Unknown author"}
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
                    value={
                      totalCode > 999
                        ? `${(totalCode / 1000).toFixed(1)}k chars`
                        : `${totalCode} chars`
                    }
                  />
                </div>
              </CardContent>

              <CardFooter className="mt-4 flex-col gap-3 border-t border-white/8 px-5 py-4">
                {/* Hardware override */}
                <div className="w-full">
                  <div className="mb-2 flex items-center gap-1.5">
                    <CircuitryIcon size={11} className="text-zinc-600" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      Hardware
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedPreset("cartridge")}
                      className={`px-2.5 py-1 text-[11px] font-medium transition ${
                        selectedPreset === "cartridge"
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                      }`}
                    >
                      Cartridge
                    </button>
                    {HARDWARE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset.id)}
                        className={`px-2.5 py-1 text-[11px] font-medium transition ${
                          selectedPreset === preset.id
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                    {customPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset.id)}
                        className={`px-2.5 py-1 text-[11px] font-medium transition ${
                          selectedPreset === preset.id
                            ? "bg-violet-600 text-white"
                            : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const hw = cartridge.hardware;
                        const ipsUnit =
                          hw.maxIps >= 1_000_000
                            ? "MIPS"
                            : hw.maxIps >= 1_000
                              ? "KIPS"
                              : "IPS";
                        const ipsVal =
                          hw.maxIps >= 1_000_000
                            ? hw.maxIps / 1_000_000
                            : hw.maxIps >= 1_000
                              ? hw.maxIps / 1_000
                              : hw.maxIps;
                        const memUnit =
                          hw.maxMemBytes >= 1024 * 1024 ? "MB" : "KB";
                        const memVal =
                          hw.maxMemBytes >= 1024 * 1024
                            ? hw.maxMemBytes / (1024 * 1024)
                            : hw.maxMemBytes / 1024;
                        setCustomFields({
                          width: String(hw.width),
                          height: String(hw.height),
                          fps: String(hw.maxFps),
                          ips: String(ipsVal),
                          ipsUnit,
                          mem: String(memVal),
                          memUnit,
                          storage: String(
                            hw.maxStorageBytes >= 1024 * 1024
                              ? hw.maxStorageBytes / (1024 * 1024)
                              : hw.maxStorageBytes / 1024,
                          ),
                          storageUnit: (hw.maxStorageBytes >= 1024 * 1024
                            ? "MB"
                            : "KB") as "KB" | "MB",
                          sprites: String(hw.maxSprites),
                          sounds: String(hw.maxSounds),
                          spriteSize: String(hw.spriteSize ?? 8),
                          sfxSteps: String(hw.sfxSteps ?? 16),
                        });
                        setSelectedPreset("custom");
                      }}
                      className={`px-2.5 py-1 text-[11px] font-medium transition ${
                        selectedPreset === "custom"
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Preset description */}
                  {hwOverride && selectedPreset !== "custom" && (
                    <p className="mt-1.5 text-[10px] text-zinc-600">
                      {
                        (
                          HARDWARE_PRESETS.find(
                            (p) => p.id === selectedPreset,
                          ) ??
                          customPresets.find((p) => p.id === selectedPreset)
                        )?.desc
                      }{" "}
                      — overrides cartridge hardware
                    </p>
                  )}

                  {/* Custom form */}
                  {selectedPreset === "custom" && (
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {/* Resolution */}
                      <div className="col-span-2">
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          Resolution
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={1024}
                            value={customFields.width}
                            onChange={(e) =>
                              setCustomFields((f) => ({
                                ...f,
                                width: e.target.value,
                              }))
                            }
                            className="w-full bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                          />
                          <span className="text-xs text-zinc-600">×</span>
                          <input
                            type="number"
                            min={1}
                            max={1024}
                            value={customFields.height}
                            onChange={(e) =>
                              setCustomFields((f) => ({
                                ...f,
                                height: e.target.value,
                              }))
                            }
                            className="w-full bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                          />
                        </div>
                      </div>

                      {/* FPS */}
                      <div>
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          Max FPS
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={240}
                          value={customFields.fps}
                          onChange={(e) =>
                            setCustomFields((f) => ({
                              ...f,
                              fps: e.target.value,
                            }))
                          }
                          className="w-full bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                        />
                      </div>

                      {/* CPU */}
                      <div>
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          CPU Speed
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min={1}
                            value={customFields.ips}
                            onChange={(e) =>
                              setCustomFields((f) => ({
                                ...f,
                                ips: e.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                          />
                          <select
                            value={customFields.ipsUnit}
                            onChange={(e) =>
                              setCustomFields((f) => ({
                                ...f,
                                ipsUnit: e.target.value as
                                  | "IPS"
                                  | "KIPS"
                                  | "MIPS",
                              }))
                            }
                            className="bg-white/5 px-1.5 py-1 text-[10px] text-zinc-400 outline-none focus:ring-1 focus:ring-violet-500/50"
                          >
                            <option value="IPS">IPS</option>
                            <option value="KIPS">KIPS</option>
                            <option value="MIPS">MIPS</option>
                          </select>
                        </div>
                      </div>

                      {/* RAM */}
                      <div>
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          RAM
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min={1}
                            value={customFields.mem}
                            onChange={(e) =>
                              setCustomFields((f) => ({
                                ...f,
                                mem: e.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                          />
                          <select
                            value={customFields.memUnit}
                            onChange={(e) =>
                              setCustomFields((f) => ({
                                ...f,
                                memUnit: e.target.value as "KB" | "MB",
                              }))
                            }
                            className="bg-white/5 px-1.5 py-1 text-[10px] text-zinc-400 outline-none focus:ring-1 focus:ring-violet-500/50"
                          >
                            <option value="KB">KB</option>
                            <option value="MB">MB</option>
                          </select>
                        </div>
                      </div>

                      {/* Storage */}
                      <div>
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          Max Storage
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min={1}
                            value={customFields.storage}
                            onChange={(e) =>
                              setCustomFields((f) => ({
                                ...f,
                                storage: e.target.value,
                              }))
                            }
                            className="min-w-0 flex-1 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                          />
                          <select
                            value={customFields.storageUnit}
                            onChange={(e) =>
                              setCustomFields((f) => ({
                                ...f,
                                storageUnit: e.target.value as "KB" | "MB",
                              }))
                            }
                            className="bg-white/5 px-1.5 py-1 text-[10px] text-zinc-400 outline-none focus:ring-1 focus:ring-violet-500/50"
                          >
                            <option value="KB">KB</option>
                            <option value="MB">MB</option>
                          </select>
                        </div>
                      </div>

                      {/* Sprites */}
                      <div>
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          Max Sprites
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={customFields.sprites}
                          onChange={(e) =>
                            setCustomFields((f) => ({
                              ...f,
                              sprites: e.target.value,
                            }))
                          }
                          className="w-full bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                        />
                      </div>

                      {/* Sounds */}
                      <div>
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          Max Sounds
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={customFields.sounds}
                          onChange={(e) =>
                            setCustomFields((f) => ({
                              ...f,
                              sounds: e.target.value,
                            }))
                          }
                          className="w-full bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                        />
                      </div>

                      {/* Sprite Size */}
                      <div>
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          Sprite Size
                        </label>
                        <select
                          value={customFields.spriteSize}
                          onChange={(e) =>
                            setCustomFields((f) => ({
                              ...f,
                              spriteSize: e.target.value,
                            }))
                          }
                          className="w-full bg-white/5 px-2 py-1 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                        >
                          {[8, 16, 32].map((s) => (
                            <option key={s} value={String(s)}>
                              {s}×{s} px
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SFX Steps */}
                      <div>
                        <label className="mb-1 block text-[10px] text-zinc-600">
                          SFX Steps
                        </label>
                        <select
                          value={customFields.sfxSteps}
                          onChange={(e) =>
                            setCustomFields((f) => ({
                              ...f,
                              sfxSteps: e.target.value,
                            }))
                          }
                          className="w-full bg-white/5 px-2 py-1 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-violet-500/50"
                        >
                          {[8, 16, 32, 64].map((s) => (
                            <option key={s} value={String(s)}>
                              {s} steps
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className="col-span-2 text-[10px] text-zinc-700">
                        Palette and inputs are inherited from the cartridge.
                      </p>
                    </div>
                  )}
                </div>

                {downgradeError && (
                  <p className="text-[11px] text-red-400">{downgradeError}</p>
                )}

                <Button
                  size="lg"
                  onClick={() => setPlaying(true)}
                  disabled={!!downgradeError}
                  className="w-full gap-2 bg-violet-600 font-semibold hover:bg-violet-500 disabled:opacity-50"
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
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-6 border-2 border-dashed px-8 py-16 transition ${
              dragging
                ? "border-violet-500 bg-violet-500/8"
                : "border-white/10 hover:border-violet-500/30 hover:bg-violet-500/4"
            }`}
          >
            <div
              className={`flex h-16 w-16 items-center justify-center border transition ${
                dragging
                  ? "border-violet-500/50 bg-violet-500/20"
                  : "border-white/10 bg-white/4"
              }`}
            >
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
                Accepts <span className="font-mono text-zinc-400">.lunx</span>{" "}
                and <span className="font-mono text-zinc-400">.lun</span> files
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/10 bg-transparent text-zinc-400 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
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
              <WarningCircleIcon
                size={14}
                className="mt-0.5 shrink-0 text-red-400"
              />
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
