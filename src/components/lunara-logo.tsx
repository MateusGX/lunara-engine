interface Props {
  subtitle?: string;
}

export function LunaraLogo({ subtitle = "engine" }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon box */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center border border-violet-900/50 bg-[#0d0a1a]">
        <span className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-violet-600" />
        <svg
          viewBox="0 0 6 8"
          className="h-5 w-4"
          shapeRendering="crispEdges"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="0" width="2" height="1" fill="#8b5cf6" />
          <rect x="0" y="1" width="2" height="1" fill="#8b5cf6" />
          <rect x="0" y="2" width="1" height="1" fill="#8b5cf6" />
          <rect x="0" y="3" width="1" height="1" fill="#8b5cf6" />
          <rect x="0" y="4" width="1" height="1" fill="#8b5cf6" />
          <rect x="0" y="5" width="2" height="1" fill="#8b5cf6" />
          <rect x="1" y="6" width="2" height="1" fill="#8b5cf6" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className="bg-linear-to-r from-white to-violet-300 bg-clip-text text-sm font-bold tracking-wide text-transparent">
          LUNARA
        </span>
        <span className="font-mono text-[9px] tracking-widest text-violet-500/70">
          {subtitle.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
