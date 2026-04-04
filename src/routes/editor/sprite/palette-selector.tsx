import { useStore } from "@/store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function PaletteSelector() {
  const { activeCartridge, activePaletteIndex, setActivePaletteIndex } = useStore();
  const palette = activeCartridge?.hardware.palette ?? [];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
        Palette
      </span>

      {/* Color grid */}
      <div className="flex flex-wrap gap-0.75">
        {palette.map((hex, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActivePaletteIndex(i)}
                style={{ backgroundColor: i === 0 ? "transparent" : hex }}
                className={`relative h-7 w-7 border transition-all ${
                  activePaletteIndex === i
                    ? "border-rpg-gold ring-1 ring-rpg-gold ring-offset-1 ring-offset-surface-base"
                    : "border-rpg-gold/15 hover:border-rpg-gold/50"
                } ${i === 0 ? "bg-transparent" : ""}`}
              >
                {i === 0 && (
                  // Transparent slot indicator
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 28 28"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="28" x2="28" y2="0" stroke="rgba(255,80,80,0.7)" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono">
                {i === 0 ? "Transparent" : hex} <span className="text-rpg-stone/70">#{i}</span>
              </span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Active color info */}
      <div className="flex items-center gap-2 border border-rpg-gold/12 bg-rpg-gold/4 px-2 py-1.5">
        <div
          className="h-5 w-5 shrink-0 border border-rpg-gold/20"
          style={{
            backgroundColor: activePaletteIndex === 0 ? "transparent" : (palette[activePaletteIndex] ?? "#000"),
          }}
        >
          {activePaletteIndex === 0 && (
            <svg viewBox="0 0 20 20" className="h-full w-full">
              <line x1="0" y1="20" x2="20" y2="0" stroke="rgba(255,80,80,0.7)" strokeWidth="1.5" />
            </svg>
          )}
        </div>
        <span className="font-mono text-[11px] text-rpg-stone/80">
          #{activePaletteIndex}{" "}
          <span className="text-rpg-parchment">
            {activePaletteIndex === 0 ? "transparent" : (palette[activePaletteIndex] ?? "—")}
          </span>
        </span>
      </div>
    </div>
  );
}
