import { useState, useMemo } from "react";
import { ArrowLeftIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LunaraLogo } from "@/components/lunara-logo";
import { RpgFrame, RpgDivider, RpgSpecPill } from "@/components/rpg-ui";
import { CartridgeScreen } from "@/routes/player/cartridge-screen";
import { HARDWARE_PRESETS } from "@/cartridge/hardware";
import { useCustomPresets } from "@/hooks/use-custom-presets";
import type { Cartridge, HardwareConfig } from "@/types/cartridge";
import { DisplayProfile } from "./display-profile";
import { DEFAULT_CUSTOM_FIELDS, type CustomFields } from "./custom-hw-form";

interface CartridgeCardProps {
  cartridge: Cartridge;
  onBack: () => void;
}

export function CartridgeCard({ cartridge, onBack }: CartridgeCardProps) {
  const { presets: customPresets } = useCustomPresets();
  const [playing, setPlaying] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("cartridge");
  const [customFields, setCustomFields] = useState<CustomFields>(DEFAULT_CUSTOM_FIELDS);

  const hwOverride = useMemo((): HardwareConfig | null => {
    if (selectedPreset === "cartridge") return null;
    if (selectedPreset === "custom") {
      const ipsM = customFields.ipsUnit === "MIPS" ? 1_000_000 : customFields.ipsUnit === "KIPS" ? 1_000 : 1;
      const memM = customFields.memUnit === "MB" ? 1024 * 1024 : 1024;
      const storageM = customFields.storageUnit === "MB" ? 1024 * 1024 : 1024;
      return {
        ...cartridge.hardware,
        width: Math.max(1, parseInt(customFields.width) || cartridge.hardware.width),
        height: Math.max(1, parseInt(customFields.height) || cartridge.hardware.height),
        maxFps: Math.max(1, parseInt(customFields.fps) || cartridge.hardware.maxFps),
        maxIps: Math.max(1, parseFloat(customFields.ips) || 1) * ipsM,
        maxMemBytes: Math.max(1024, parseFloat(customFields.mem) || 1) * memM,
        maxStorageBytes: Math.max(1024, parseFloat(customFields.storage) || 1) * storageM,
        maxSprites: Math.max(1, parseInt(customFields.sprites) || cartridge.hardware.maxSprites),
        maxSounds: Math.max(1, parseInt(customFields.sounds) || cartridge.hardware.maxSounds),
        spriteSize: parseInt(customFields.spriteSize) || (cartridge.hardware.spriteSize ?? 8),
        sfxSteps: parseInt(customFields.sfxSteps) || (cartridge.hardware.sfxSteps ?? 16),
      };
    }
    return HARDWARE_PRESETS.find((p) => p.id === selectedPreset)?.hw
      ?? customPresets.find((p) => p.id === selectedPreset)?.hw
      ?? null;
  }, [selectedPreset, customFields, cartridge, customPresets]);

  const downgradeError = useMemo((): string | null => {
    if (!hwOverride) return null;
    const sz = hwOverride.spriteSize ?? 8;
    const spriteConflict = cartridge.sprites.find((s) => s.width > sz || s.height > sz);
    if (spriteConflict)
      return `Sprite #${spriteConflict.id} is ${spriteConflict.width}×${spriteConflict.height} — larger than the preset's sprite size (${sz}px).`;
    const steps = hwOverride.sfxSteps ?? 16;
    const soundConflict = cartridge.sounds.find((s) => s.steps > steps);
    if (soundConflict)
      return `"${soundConflict.name}" has ${soundConflict.steps} steps — more than the preset's SFX steps (${steps}).`;
    return null;
  }, [hwOverride, cartridge]);

  if (playing) {
    return (
      <div className="group/player flex h-screen flex-col bg-black">
        <div className="flex items-center justify-between px-4 py-2 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100">
          <Button variant="ghost" size="sm" onClick={() => setPlaying(false)} className="gap-1.5 text-rpg-stone/60 hover:text-rpg-parchment">
            <ArrowLeftIcon size={13} /> Back
          </Button>
          <div className="w-16" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <CartridgeScreen cartridge={hwOverride ? { ...cartridge, hardware: hwOverride } : cartridge} />
        </div>

        <div className="flex items-center gap-4 border-t border-rpg-gold/8 px-5 py-2.5 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100">
          <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
            <span className="truncate text-sm font-semibold text-rpg-parchment">{cartridge.meta.name}</span>
            {cartridge.meta.version && (
              <Badge variant="outline" className="shrink-0 border-rpg-gold/20 bg-transparent px-1 py-0 font-mono text-[9px] text-rpg-stone/60">
                v{cartridge.meta.version}
              </Badge>
            )}
            {cartridge.meta.author && (
              <>
                <span className="shrink-0 text-rpg-gold/30">·</span>
                <span className="shrink-0 text-xs text-rpg-stone/60">{cartridge.meta.author}</span>
              </>
            )}
          </div>
          <span className="shrink-0 font-mono text-[10px] text-rpg-stone/50">
            {cartridge.hardware.width}×{cartridge.hardware.height}
          </span>
        </div>
      </div>
    );
  }

  const palette = cartridge.hardware.palette;
  const totalCode = cartridge.scripts.reduce((s, sc) => s + sc.code.length, 0);

  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-rpg-parchment">
      <header className="border-b border-rpg-gold/12 px-6 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <LunaraLogo subtitle="launcher" />
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1.5 text-xs text-rpg-stone/60 hover:text-rpg-parchment">
            <ArrowLeftIcon size={13} /> Load another
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <RpgFrame glow cornerSize="lg" className="overflow-hidden">

            {/* Cover */}
            <div className="relative h-44 overflow-hidden bg-surface-base">
              {cartridge.meta.coverArt ? (
                <img src={cartridge.meta.coverArt} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${palette[1] ?? "#1D2B53"}55 0%, ${palette[Math.min(8, palette.length - 1)] ?? "#FF004D"}22 100%)`,
                  }}
                />
              )}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-card/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex h-1.5">
                {palette.slice(0, 8).map((hex, i) => (
                  <div key={i} className="flex-1" style={{ background: hex }} />
                ))}
              </div>
              <span className="absolute left-3 top-3 border border-rpg-gold/15 bg-surface-base/70 px-2 py-0.5 font-mono text-[9px] text-rpg-stone/60 backdrop-blur-sm">
                {cartridge.hardware.width}×{cartridge.hardware.height}
              </span>
            </div>

            {/* Title */}
            <div className="px-5 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-base font-bold text-rpg-parchment">{cartridge.meta.name}</h1>
                  <p className="text-xs text-rpg-stone/60">
                    {cartridge.meta.author ? `by ${cartridge.meta.author}` : "Unknown author"}
                  </p>
                </div>
                {cartridge.meta.version && (
                  <Badge variant="outline" className="mt-0.5 shrink-0 border-rpg-gold/20 bg-rpg-gold/5 px-1.5 font-mono text-[10px] text-rpg-stone/70">
                    v{cartridge.meta.version}
                  </Badge>
                )}
              </div>
              {cartridge.meta.description && (
                <p className="mt-2 text-xs leading-relaxed text-rpg-stone/70">{cartridge.meta.description}</p>
              )}
            </div>

            <RpgDivider className="mx-5 my-3" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 px-5">
              <RpgSpecPill label="RES" value={`${cartridge.hardware.width}×${cartridge.hardware.height}`} />
              <RpgSpecPill label="PAL" value={`${cartridge.hardware.palette.length} colors`} />
              <RpgSpecPill label="FPS" value={`${cartridge.hardware.maxFps}`} />
              <RpgSpecPill label="SPR" value={`${cartridge.sprites.length}`} />
              <RpgSpecPill label="SND" value={`${cartridge.sounds.length}`} />
              <RpgSpecPill label="CODE" value={totalCode > 999 ? `${(totalCode / 1000).toFixed(1)}k` : `${totalCode} chars`} />
            </div>

            <RpgDivider className="mx-5 my-3" />

            <DisplayProfile
              cartridge={cartridge}
              selectedPreset={selectedPreset}
              setSelectedPreset={setSelectedPreset}
              customFields={customFields}
              setCustomFields={(patch) => setCustomFields((f) => ({ ...f, ...patch }))}
              hwOverride={hwOverride}
              customPresets={customPresets}
            />

            {/* Footer */}
            <div className="mt-4 flex flex-col gap-3 border-t border-rpg-gold/10 px-5 py-4">
              {downgradeError && (
                <p className="text-[11px] text-rpg-blood">{downgradeError}</p>
              )}
              <Button
                size="lg"
                variant="emerald"
                onClick={() => setPlaying(true)}
                disabled={!!downgradeError}
                className="w-full gap-2 font-semibold disabled:opacity-50"
              >
                <PlayIcon size={16} weight="fill" /> Play
              </Button>
              <p className="text-center text-[10px] text-rpg-stone/50">
                Runs in memory — nothing is saved to disk.
              </p>
            </div>

          </RpgFrame>
        </div>
      </main>
    </div>
  );
}
