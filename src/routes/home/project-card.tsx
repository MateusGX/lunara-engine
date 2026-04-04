import { useNavigate } from "react-router-dom";
import {
  PlayIcon,
  PencilSimpleIcon,
  TrashIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HARDWARE_PRESETS } from "@/cartridge/hardware";
import { loadCustomPresets } from "@/cartridge/custom-presets";
import type { Cartridge, HardwareConfig } from "@/types/cartridge";

function getPresetName(hw: HardwareConfig): string {
  const match =
    HARDWARE_PRESETS.find(
      (p) =>
        p.hw.width === hw.width &&
        p.hw.height === hw.height &&
        p.hw.maxFps === hw.maxFps &&
        p.hw.maxIps === hw.maxIps &&
        p.hw.palette.length === hw.palette.length,
    ) ??
    loadCustomPresets().find(
      (p) =>
        p.hw.width === hw.width &&
        p.hw.height === hw.height &&
        p.hw.maxFps === hw.maxFps &&
        p.hw.maxIps === hw.maxIps &&
        p.hw.palette.length === hw.palette.length,
    );
  return match?.name ?? "Custom";
}

interface Props {
  cartridge: Cartridge;
  onDelete: (id: string) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(ts));
}

export function ProjectCard({ cartridge, onDelete }: Props) {
  const navigate = useNavigate();
  const palette = cartridge.hardware.palette;
  const hw = cartridge.hardware;

  return (
    <div className="group relative flex flex-col overflow-hidden border border-rpg-gold/15 bg-surface-card transition-all duration-200 hover:border-rpg-gold/40 hover:shadow-[0_0_28px_oklch(0.68_0.22_300/10%)]">
      {/* Corner ornaments */}
      <span className="pointer-events-none absolute top-0 left-0 z-10 h-3 w-3 border-t border-l border-rpg-gold/35 transition-colors duration-200 group-hover:border-rpg-gold/75" />
      <span className="pointer-events-none absolute top-0 right-0 z-10 h-3 w-3 border-t border-r border-rpg-gold/35 transition-colors duration-200 group-hover:border-rpg-gold/75" />
      <span className="pointer-events-none absolute bottom-0 left-0 z-10 h-3 w-3 border-b border-l border-rpg-gold/35 transition-colors duration-200 group-hover:border-rpg-gold/75" />
      <span className="pointer-events-none absolute bottom-0 right-0 z-10 h-3 w-3 border-b border-r border-rpg-gold/35 transition-colors duration-200 group-hover:border-rpg-gold/75" />

      {/* ── Label strip (cartridge header) ── */}
      <div className="flex items-center gap-2 border-b border-rpg-gold/10 bg-surface-raised px-2.5 py-1.5">
        <span className="h-2.5 w-0.5 bg-rpg-gold/60" />
        <span className="flex-1 font-mono text-[9px] tracking-[0.25em] text-rpg-gold/50 uppercase">
          {getPresetName(hw)}
        </span>
        {cartridge.meta.version && (
          <span className="font-mono text-[9px] text-rpg-stone/40">
            v{cartridge.meta.version}
          </span>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-5 w-5 text-rpg-stone/40 hover:bg-rpg-gold/8 hover:text-rpg-gold"
              >
                <DotsThreeIcon size={13} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-rpg-gold/20 bg-surface-overlay"
            >
              <DropdownMenuItem
                onClick={() => navigate(`/studio/editor/${cartridge.meta.id}`)}
                className="cursor-pointer gap-2 text-xs text-rpg-parchment focus:bg-rpg-gold/8 focus:text-rpg-gold"
              >
                <PencilSimpleIcon size={13} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/play/${cartridge.meta.id}`)}
                className="cursor-pointer gap-2 text-xs text-rpg-parchment focus:bg-rpg-emerald/8 focus:text-rpg-emerald"
              >
                <PlayIcon size={13} weight="fill" /> Play
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-rpg-gold/12" />
              <DropdownMenuItem
                onClick={() => onDelete(cartridge.meta.id)}
                className="cursor-pointer gap-2 text-xs text-rpg-blood focus:bg-rpg-blood/10 focus:text-rpg-blood"
              >
                <TrashIcon size={13} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Art area ── */}
      <div className="relative h-32 w-full overflow-hidden bg-surface-base">
        {cartridge.meta.coverArt ? (
          <img
            src={cartridge.meta.coverArt}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(145deg, ${palette[1] ?? "#1a1030"}55 0%, ${palette[Math.floor(palette.length / 2)] ?? "#a259ef"}22 60%, transparent 100%)`,
              }}
            />
            {/* Ambient glow */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 70% 60% at 50% 60%, ${palette[0] ?? "#a259ef"}18 0%, transparent 70%)`,
              }}
            />
            {/* Watermark name */}
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <span className="truncate font-mono text-xs font-bold tracking-widest text-rpg-gold/20 uppercase">
                {cartridge.meta.name}
              </span>
            </div>
          </>
        )}

        {/* Palette swatches — bottom-left */}
        <div className="absolute bottom-2 left-2 flex gap-0.5">
          {palette.slice(0, 6).map((hex, i) => (
            <div
              key={i}
              className="h-2 w-2 border border-black/20"
              style={{ background: hex }}
            />
          ))}
        </div>

        {/* Resolution badge — bottom-right */}
        <span className="absolute bottom-2 right-2 font-mono text-[9px] text-rpg-stone/50">
          {hw.width}×{hw.height}
        </span>
      </div>

      {/* ── Divider with diamonds ── */}
      <div className="relative flex items-center border-t border-rpg-gold/12">
        <span className="absolute left-3 h-1.5 w-1.5 rotate-45 bg-rpg-gold/40" />
        <span className="absolute right-3 h-1.5 w-1.5 rotate-45 bg-rpg-gold/40" />
      </div>

      {/* ── Info ── */}
      <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
        <p className="truncate font-bold leading-tight tracking-wide text-rpg-parchment">
          {cartridge.meta.name}
        </p>
        <p className="truncate font-mono text-[10px] text-rpg-stone/70">
          {cartridge.meta.author || "—"}
        </p>
        <span className="font-mono text-[9px] text-rpg-stone/40">
          {timeAgo(cartridge.meta.updated)}
        </span>
      </div>

      {/* ── Actions ── */}
      <div className="flex border-t border-rpg-gold/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/studio/editor/${cartridge.meta.id}`)}
          className="h-8 flex-1 gap-1.5 rounded-none border-0 text-xs text-rpg-stone/60 hover:bg-rpg-gold/6 hover:text-rpg-parchment"
        >
          <PencilSimpleIcon size={12} /> Edit
        </Button>
        <div className="w-px bg-rpg-gold/10" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/play/${cartridge.meta.id}`)}
          className="h-8 flex-1 gap-1.5 rounded-none border-0 text-xs text-rpg-emerald/70 hover:bg-rpg-emerald/8 hover:text-rpg-emerald"
        >
          <PlayIcon size={12} weight="fill" /> Play
        </Button>
      </div>
    </div>
  );
}
