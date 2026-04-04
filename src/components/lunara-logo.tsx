interface Props {
  subtitle?: string;
}

export function LunaraLogo({ subtitle = "studio" }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon box with corner ornaments */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center border border-rpg-gold/25 bg-surface-raised">
        <span className="pointer-events-none absolute top-0 left-0 h-1.5 w-1.5 border-t border-l border-rpg-gold/60" />
        <span className="pointer-events-none absolute top-0 right-0 h-1.5 w-1.5 border-t border-r border-rpg-gold/60" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-rpg-gold/60" />
        <span className="absolute bottom-0 right-0 h-2 w-2 bg-rpg-gold" />
        <svg
          viewBox="0 0 6 8"
          className="h-5 w-4"
          shapeRendering="crispEdges"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="0" width="2" height="1" fill="oklch(0.68 0.22 300)" />
          <rect x="0" y="1" width="2" height="1" fill="oklch(0.68 0.22 300)" />
          <rect x="0" y="2" width="1" height="1" fill="oklch(0.68 0.22 300)" />
          <rect x="0" y="3" width="1" height="1" fill="oklch(0.68 0.22 300)" />
          <rect x="0" y="4" width="1" height="1" fill="oklch(0.68 0.22 300)" />
          <rect x="0" y="5" width="2" height="1" fill="oklch(0.68 0.22 300)" />
          <rect x="1" y="6" width="2" height="1" fill="oklch(0.68 0.22 300)" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none justify-center items-center">
        <span
          className="text-sm font-bold tracking-[0.15em]"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.88 0.16 300) 0%, oklch(0.60 0.22 300) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          LUNARA
        </span>
        <span className="font-mono text-[8px] tracking-[0.35em] text-rpg-gold/50 uppercase">
          ✦ {subtitle} ✦
        </span>
      </div>
    </div>
  );
}
