import { useState, useRef } from "react";
import { useStore } from "@/store";
import { calcStorageBytes } from "@/cartridge/export";
import { HARDWARE_PRESETS } from "@/cartridge/hardware";
import {
  UploadSimpleIcon,
  XIcon,
  CpuIcon,
  HardDriveIcon,
  GameControllerIcon,
  MonitorIcon,
  PaletteIcon,
  IdentificationCardIcon,
  CircuitryIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RpgDivider,
  RpgFrame,
  RpgSectionHeader,
  RpgSpecPill,
  RpgUsageBar,
} from "@/components/rpg-ui";

function formatBytes(b: number) {
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function formatIps(ips: number) {
  if (ips >= 1_000_000) return `${(ips / 1_000_000).toFixed(1)} MIPS`;
  if (ips >= 1_000) return `${(ips / 1_000).toFixed(0)} KIPS`;
  return `${ips} IPS`;
}

export function SettingsTab() {
  const { activeCartridge, updateActiveCartridge } = useStore();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeCartridge) return null;
  const hw = activeCartridge.hardware;

  const activePresetName =
    HARDWARE_PRESETS.find(
      (p) =>
        p.hw.width === hw.width &&
        p.hw.height === hw.height &&
        p.hw.maxFps === hw.maxFps &&
        p.hw.maxIps === hw.maxIps &&
        p.hw.palette.length === hw.palette.length,
    )?.name ?? "Custom";

  function updateMeta(
    patch: Partial<import("@/types/cartridge").CartridgeMeta>,
  ) {
    updateActiveCartridge({ meta: { ...activeCartridge!.meta, ...patch } });
  }

  function handleCoverFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => updateMeta({ coverArt: e.target?.result as string });
    reader.readAsDataURL(file);
  }

  const storageUsed = calcStorageBytes(activeCartridge);
  const storageLimit = hw.maxStorageBytes ?? 512 * 1024;
  const storageOver = storageUsed > storageLimit;

  const inputCls =
    "border-rpg-gold/15 bg-surface-raised text-rpg-parchment focus-visible:border-rpg-gold/45 focus-visible:ring-0";

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-2xl space-y-8 p-6">
        {/* ── Project Inscription ── */}
        <section className="space-y-4">
          <RpgSectionHeader
            icon={IdentificationCardIcon}
            title="Project Info"
          />
          <RpgDivider />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-rpg-stone">Name</Label>
              <Input
                value={activeCartridge.meta.name}
                onChange={(e) => updateMeta({ name: e.target.value })}
                placeholder="My Game"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-rpg-stone">Author</Label>
              <Input
                value={activeCartridge.meta.author}
                onChange={(e) => updateMeta({ author: e.target.value })}
                placeholder="your name"
                className={inputCls}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-rpg-stone">Description</Label>
              <textarea
                value={activeCartridge.meta.description}
                onChange={(e) => updateMeta({ description: e.target.value })}
                placeholder="A short description of your game…"
                rows={2}
                className="w-full border border-rpg-gold/15 bg-surface-raised px-3 py-2 text-sm text-rpg-parchment placeholder:text-rpg-stone/40 focus:border-rpg-gold/45 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-rpg-stone">Version</Label>
              <Input
                value={activeCartridge.meta.version}
                onChange={(e) => updateMeta({ version: e.target.value })}
                placeholder="1.0.0"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-rpg-stone">ID</Label>
              <Input
                value={activeCartridge.meta.id}
                readOnly
                className="border-rpg-gold/8 bg-surface-base font-mono text-xs text-rpg-stone/50 focus-visible:ring-0"
              />
            </div>
          </div>
        </section>

        {/* ── Cover Sigil ── */}
        <section className="space-y-4">
          <RpgSectionHeader icon={UploadSimpleIcon} title="Cover Art" />
          <RpgDivider />
          <div className="flex gap-4">
            <div
              className={`relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 transition ${
                dragging
                  ? "border-rpg-gold/60 bg-rpg-gold/10"
                  : "border-dashed border-rpg-gold/20 bg-surface-raised hover:border-rpg-gold/35"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleCoverFile(file);
              }}
            >
              {/* Corner ornaments on the drop zone */}
              <span className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-rpg-gold/40" />
              <span className="pointer-events-none absolute top-0 right-0 h-2.5 w-2.5 border-t border-r border-rpg-gold/40" />
              <span className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-rpg-gold/40" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-rpg-gold/40" />

              {activeCartridge.meta.coverArt ? (
                <img
                  src={activeCartridge.meta.coverArt}
                  alt="Cover sigil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-rpg-stone/60">
                  <UploadSimpleIcon size={20} />
                  <span className="text-center text-[10px] leading-tight">
                    Drop or click
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverFile(file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="flex flex-col justify-between py-1">
              <div className="space-y-1">
                <p className="text-xs text-rpg-stone/80">
                  {activeCartridge.meta.coverArt
                    ? "Cover art set"
                    : "No cover art"}
                </p>
                <p className="text-[10px] text-rpg-stone/50">
                  PNG, JPG or GIF · shown on the project card
                </p>
              </div>
              {activeCartridge.meta.coverArt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateMeta({ coverArt: undefined })}
                  className="w-fit gap-1.5 text-xs text-rpg-blood/60 hover:bg-rpg-blood/10 hover:text-rpg-blood"
                >
                  <XIcon size={12} /> Remove
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ── Arcane Vessel ── */}
        <section className="space-y-4">
          <RpgSectionHeader icon={CircuitryIcon} title="Hardware Profile" />
          <RpgDivider />

          {/* Preset banner */}
          <RpgFrame glow className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold tracking-wider text-rpg-gold">
                {activePresetName}
              </span>
              <span className="font-mono text-[10px] text-rpg-stone/60">
                {hw.width}×{hw.height} · {hw.maxFps} fps · {hw.palette.length}{" "}
                colors
              </span>
            </div>
            {/* Palette strip */}
            <div className="flex h-2 w-full overflow-hidden border border-rpg-gold/12">
              {hw.palette.slice(1).map((c: string, i: number) => (
                <div key={i} className="flex-1" style={{ background: c }} />
              ))}
            </div>
          </RpgFrame>

          {/* Spec rows */}
          <div className="divide-y divide-rpg-gold/8 border border-rpg-gold/12">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <MonitorIcon
                size={12}
                className="shrink-0 text-rpg-stone/50"
                weight="bold"
              />
              <span className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-rpg-stone/50">
                Screen
              </span>
              <div className="flex flex-1 items-center gap-6">
                <RpgSpecPill label="RES" value={`${hw.width}×${hw.height}`} />
                <RpgSpecPill label="FPS" value={hw.maxFps} />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <CpuIcon
                size={12}
                className="shrink-0 text-rpg-stone/50"
                weight="bold"
              />
              <span className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-rpg-stone/50">
                Hardware
              </span>
              <div className="flex flex-1 items-center gap-6">
                <RpgSpecPill label="CPU" value={formatIps(hw.maxIps)} />
                <RpgSpecPill label="RAM" value={formatBytes(hw.maxMemBytes)} />
                <RpgSpecPill
                  label="Storage"
                  value={formatBytes(storageLimit)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <HardDriveIcon
                size={12}
                className="shrink-0 text-rpg-stone/50"
                weight="bold"
              />
              <span className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-rpg-stone/50">
                Assets
              </span>
              <div className="flex flex-1 items-center gap-6">
                <RpgSpecPill label="Sprites" value={hw.maxSprites} />
                <RpgSpecPill label="Sounds" value={hw.maxSounds} />
                <RpgSpecPill
                  label="SPR Size"
                  value={`${hw.spriteSize ?? 8}px`}
                />
                <RpgSpecPill label="SFX Steps" value={hw.sfxSteps ?? 16} />
              </div>
            </div>
          </div>

          {/* Usage */}
          <RpgFrame className="bg-surface-base/60 p-3 flex flex-col gap-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/60">
              Usage
            </span>
            <RpgUsageBar
              used={activeCartridge.sprites.length}
              total={hw.maxSprites}
              label="Sprites"
            />
            <RpgUsageBar
              used={activeCartridge.sounds.length}
              total={hw.maxSounds}
              label="Sounds"
            />
            <RpgUsageBar
              used={storageUsed}
              total={storageLimit}
              label="Storage"
              format={formatBytes}
            />
          </RpgFrame>

          {storageOver && (
            <p className="text-[11px] text-rpg-blood">
              Storage over limit: {formatBytes(storageUsed)} /{" "}
              {formatBytes(storageLimit)}
            </p>
          )}
        </section>

        {/* ── Color Palette ── */}
        <section className="space-y-4">
          <RpgSectionHeader
            icon={PaletteIcon}
            title={`Palette (${hw.palette.length} colors)`}
          />
          <RpgDivider />
          <div className="flex flex-wrap gap-1.5">
            {hw.palette.map((hex: string, i: number) => (
              <div
                key={i}
                className="group relative flex flex-col items-center gap-1"
              >
                {i === 0 ? (
                  <div
                    className="relative h-8 w-8 border border-rpg-gold/15"
                    title="Index 0 — transparent"
                  >
                    <svg
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 32 32"
                    >
                      <line
                        x1="0"
                        y1="32"
                        x2="32"
                        y2="0"
                        stroke="oklch(0.55 0.22 25 / 50%)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                ) : (
                  <div
                    className="h-8 w-8 border border-rpg-gold/15 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: hex }}
                    title={`${i}: ${hex}`}
                  />
                )}
                <span className="font-mono text-[8px] text-rpg-stone/50">
                  {i === 0 ? "0" : i}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Controls ── */}
        <section className="space-y-4">
          <RpgSectionHeader
            icon={GameControllerIcon}
            title="Controls / Inputs"
          />
          <RpgDivider />
          {hw.inputs.length === 0 ? (
            <p className="text-[11px] text-rpg-stone/50">No inputs defined.</p>
          ) : (
            <div className="grid grid-cols-2 gap-px border border-rpg-gold/12 bg-rpg-gold/8">
              {hw.inputs.map(
                (inp: { button: number; label: string; key: string }) => (
                  <div
                    key={inp.button}
                    className="flex items-center justify-between gap-3 bg-surface-base px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-4 w-4 items-center justify-center border border-rpg-gold/20 bg-rpg-gold/8 font-mono text-[9px] text-rpg-stone/60">
                        {inp.button}
                      </span>
                      <span className="text-xs font-medium text-rpg-parchment">
                        {inp.label}
                      </span>
                    </div>
                    <kbd className="border border-rpg-gold/20 bg-surface-raised px-2 py-0.5 font-mono text-[10px] text-rpg-stone/70">
                      {inp.key || "—"}
                    </kbd>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </ScrollArea>
  );
}
