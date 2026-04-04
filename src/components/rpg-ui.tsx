/**
 * Shared RPG UI primitives.
 *
 * RpgFrame        — bordered panel with corner ornaments + optional ambient glow
 * RpgDivider      — ◆────────◆ decorative separator
 * RpgSectionHeader — icon + uppercase gold label + optional action slot
 * RpgGlowBg       — full-page radial ambient torch light (used in landing/home)
 */

import React from "react";
import { cn } from "@/lib/utils";

// ── RpgFrame ──────────────────────────────────────────────────────────────────
// A box with gold-tinted border and corner ornaments.
// Use as a drop-in replacement for `<div className="border ...">` wherever
// you want the "carved stone with gold trim" look.

interface RpgFrameProps extends React.ComponentProps<"div"> {
  /** Adds a faint ambient glow around the frame */
  glow?: boolean;
  /** Corner ornament size (default: 3 = 12px) */
  cornerSize?: "sm" | "md" | "lg";
}

export function RpgFrame({
  className,
  glow = false,
  cornerSize = "md",
  children,
  ...props
}: RpgFrameProps) {
  const corner = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }[cornerSize];

  return (
    <div
      className={cn(
        "relative border border-rpg-gold/20 bg-surface-card",
        glow && "shadow-[0_0_24px_oklch(0.72_0.14_300/8%)]",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0 left-0 border-t border-l border-rpg-gold/50",
          corner,
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute top-0 right-0 border-t border-r border-rpg-gold/50",
          corner,
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 border-b border-l border-rpg-gold/50",
          corner,
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-0 right-0 border-b border-r border-rpg-gold/50",
          corner,
        )}
      />
      {children}
    </div>
  );
}

// ── RpgDivider ────────────────────────────────────────────────────────────────
// Renders: ──◆── or ──◆  label  ◆──

interface RpgDividerProps {
  label?: string;
  className?: string;
}

export function RpgDivider({ label, className }: RpgDividerProps) {
  return (
    <div className={cn("flex items-center gap-2 text-rpg-gold/40", className)}>
      <div className="h-px flex-1 bg-rpg-gold/18" />
      <span className="text-[10px] select-none">
        {label ? `◆ ${label} ◆` : "◆"}
      </span>
      <div className="h-px flex-1 bg-rpg-gold/18" />
    </div>
  );
}

// ── RpgSectionHeader ──────────────────────────────────────────────────────────
// Icon + uppercase gold label row, with optional right-side action.

interface RpgSectionHeaderProps {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function RpgSectionHeader({
  icon: Icon,
  title,
  action,
  className,
}: RpgSectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        <Icon size={12} className="shrink-0 text-rpg-gold/70" weight="bold" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/80">
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}

// ── RpgGlowBg ─────────────────────────────────────────────────────────────────
// Decorative radial background glow — simulates torch light in a dungeon.

interface RpgGlowBgProps {
  className?: string;
  /** Where the light centre sits. Defaults to top-center. */
  position?: string;
}

export function RpgGlowBg({ className, position = "50% 35%" }: RpgGlowBgProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background: `radial-gradient(ellipse 65% 50% at ${position}, oklch(0.68 0.22 300 / 7%) 0%, transparent 70%)`,
      }}
    />
  );
}

// ── RpgSpecPill ───────────────────────────────────────────────────────────────
// Small "LABEL value" pair used in hardware/settings readouts.

interface RpgSpecPillProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function RpgSpecPill({ label, value, className }: RpgSpecPillProps) {
  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      <span className="text-[10px] uppercase tracking-wider text-rpg-stone/70">
        {label}
      </span>
      <span className="font-mono text-xs font-medium text-rpg-parchment">
        {value}
      </span>
    </div>
  );
}

// ── RpgUsageBar ───────────────────────────────────────────────────────────────
// Labelled progress bar with RPG-colored fill thresholds.

interface RpgUsageBarProps {
  label: string;
  used: number;
  total: number;
  format?: (n: number) => string;
}

export function RpgUsageBar({ label, used, total, format }: RpgUsageBarProps) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color =
    pct > 90 ? "bg-rpg-blood" : pct > 70 ? "bg-yellow-500" : "bg-rpg-gold/70";
  const fmt = format ?? String;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-rpg-stone/60">
          {label}
        </span>
        <span className="whitespace-nowrap font-mono text-[9px] text-rpg-stone/50">
          {fmt(used)} / {fmt(total)}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden bg-rpg-gold/8">
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-300",
            color,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
