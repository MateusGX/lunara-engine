import { MapCanvas } from "../map/map-canvas";
import { TilePicker } from "../map/tile-picker";
import { MapList } from "../map/map-list";
import { useStore } from "@/store";
import {
  PaintBucketIcon,
  EraserIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowsOutCardinalIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const TOOLS = [
  { id: "paint" as const, icon: PaintBucketIcon, label: "Paint", shortcut: "P" },
  { id: "erase" as const, icon: EraserIcon, label: "Erase", shortcut: "E" },
];

export function MapTab() {
  const {
    mapTool,
    setMapTool,
    mapZoom,
    setMapZoom,
    activeCartridge,
    selectedMapId,
  } = useStore();

  const map = activeCartridge?.maps[selectedMapId];

  return (
    <div className="flex h-full gap-0">
      {/* Canvas area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-rpg-gold/12 px-3 py-1.5">
          {/* Tools */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
              Tools
            </span>
            <div className="flex gap-1">
              {TOOLS.map(({ id, icon: Icon, label, shortcut }) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={mapTool === id ? "default" : "ghost"}
                      size="icon-sm"
                      onClick={() => setMapTool(id)}
                      className={mapTool === id ? "bg-rpg-gold text-surface-base hover:bg-rpg-gold-bright" : "text-rpg-stone/60"}
                    >
                      <Icon size={15} weight={mapTool === id ? "fill" : "regular"} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{label}</span>
                    <kbd className="ml-1.5 border border-rpg-gold/20 bg-rpg-gold/8 px-1 py-0.5 font-mono text-[10px]">
                      {shortcut}
                    </kbd>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pan hint */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-rpg-stone/60">
                  <ArrowsOutCardinalIcon size={13} />
                  <span className="text-[10px]">Pan</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Space + drag · middle-click drag</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 bg-rpg-gold/12" />

            {/* Zoom */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMapZoom(Math.max(1, mapZoom - 1))}
                className="text-rpg-stone/60 hover:text-rpg-parchment"
              >
                <MagnifyingGlassMinusIcon size={14} />
              </Button>
              <span className="min-w-8 text-center font-mono text-xs text-rpg-stone/80">
                {mapZoom}x
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMapZoom(Math.min(8, mapZoom + 1))}
                className="text-rpg-stone/60 hover:text-rpg-parchment"
              >
                <MagnifyingGlassPlusIcon size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Map breadcrumb */}
        {map && (
          <div className="shrink-0 flex items-center gap-2 border-b border-rpg-gold/8 px-3 py-1">
            <span className="font-mono text-[10px] text-rpg-stone/80">#{map.id}</span>
            <span className="text-[11px] text-rpg-stone/60">{map.name}</span>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <MapCanvas />
        </div>
      </div>

      <Separator orientation="vertical" className="bg-rpg-gold/12" />

      {/* Right panel */}
      <ScrollArea className="w-52">
        <div className="flex w-52 flex-col gap-4 overflow-x-hidden p-3">
          <MapList />
          <Separator className="bg-rpg-gold/12" />
          <TilePicker />
        </div>
      </ScrollArea>
    </div>
  );
}
