import { useRef, useState, useCallback } from "react";
import { SpriteCanvas, type SpriteCanvasHandle } from "../sprite/sprite-canvas";
import { SpriteList } from "../sprite/sprite-list";
import { SpriteTools } from "../sprite/sprite-tools";
import { PaletteSelector } from "../sprite/palette-selector";
import { useStore } from "@/store";
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SpriteTab() {
  const { spriteZoom, setSpriteZoom, activeCartridge, selectedSpriteId } = useStore();
  const canvasRef = useRef<SpriteCanvasHandle>(null);
  const [hovered, setHovered] = useState<[number, number] | null>(null);

  const sprite = activeCartridge?.sprites[selectedSpriteId];

  const handleHover = useCallback((coords: [number, number] | null) => {
    setHovered(coords);
  }, []);

  return (
    <div className="flex h-full gap-0">
      {/* Left panel: canvas + tools */}
      <div className="flex flex-1 flex-col gap-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-white/8 px-3 py-1.5">
          <SpriteTools />

          <div className="flex items-center gap-2">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => canvasRef.current?.undo()}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    <ArrowCounterClockwiseIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Undo
                  <kbd className="ml-1.5 rounded border border-white/10 bg-white/10 px-1 py-0.5 font-mono text-[10px]">
                    Ctrl+Z
                  </kbd>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => canvasRef.current?.redo()}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    <ArrowClockwiseIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Redo
                  <kbd className="ml-1.5 rounded border border-white/10 bg-white/10 px-1 py-0.5 font-mono text-[10px]">
                    Ctrl+Y
                  </kbd>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-5 bg-white/8" />

            {/* Zoom */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSpriteZoom(Math.max(4, spriteZoom - 4))}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <MagnifyingGlassMinusIcon size={14} />
              </Button>
              <span className="min-w-8 text-center font-mono text-xs text-zinc-300">
                {spriteZoom}x
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSpriteZoom(Math.min(32, spriteZoom + 4))}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <MagnifyingGlassPlusIcon size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-auto p-6">
          <SpriteCanvas ref={canvasRef} onHover={handleHover} />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-white/8 px-3 py-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-300">
              {sprite ? `#${sprite.id}` : ""}
            </span>
            {sprite?.name && (
              <span className="text-[10px] text-zinc-400">{sprite.name}</span>
            )}
            {sprite && (
              <span className="font-mono text-[10px] text-zinc-400">
                {sprite.width}×{sprite.height}
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] text-zinc-300">
            {hovered ? `x: ${hovered[0]}  y: ${hovered[1]}` : ""}
          </span>
        </div>
      </div>

      <Separator orientation="vertical" className="bg-white/8" />

      {/* Right panel: sprite list + palette */}
      <ScrollArea className="w-52">
        <div className="flex w-52 flex-col gap-4 overflow-x-hidden p-3">
          <SpriteList />
          <Separator className="bg-white/8" />
          <PaletteSelector />
        </div>
      </ScrollArea>
    </div>
  );
}
