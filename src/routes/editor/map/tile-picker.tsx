import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import type { SpriteData } from "@/types/cartridge";

const THUMB = 36;

function TilePreview({
  sprite,
  palette,
  selected,
  onClick,
}: {
  sprite: SpriteData;
  palette: string[];
  selected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoom = THUMB / sprite.width;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, THUMB, THUMB);
    // Checkerboard
    for (let py = 0; py < sprite.height; py++) {
      for (let px = 0; px < sprite.width; px++) {
        ctx.fillStyle = (px + py) % 2 === 0 ? "#1c1c2e" : "#151525";
        ctx.fillRect(px * zoom, py * zoom, zoom, zoom);
      }
    }
    for (let py = 0; py < sprite.height; py++) {
      for (let px = 0; px < sprite.width; px++) {
        const c = sprite.pixels[py * sprite.width + px];
        if (c === 0) continue;
        ctx.fillStyle = palette[c] ?? "#000";
        ctx.fillRect(px * zoom, py * zoom, zoom, zoom);
      }
    }
  }, [sprite, palette, zoom]);

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-0.5 p-1 transition ${
        selected
          ? "bg-rpg-gold/12 outline-2 -outline-offset-1 outline-rpg-gold"
          : "hover:bg-rpg-gold/6"
      }`}
    >
      <canvas
        ref={canvasRef}
        width={THUMB}
        height={THUMB}
        className="border border-rpg-gold/15"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="font-mono text-[9px] text-rpg-stone/70">{sprite.id}</span>
    </button>
  );
}

export function TilePicker() {
  const { activeCartridge, activeTileSpriteId, setActiveTileSpriteId } = useStore();
  if (!activeCartridge) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
        Tiles
      </span>
      <div className="flex flex-wrap gap-0.5">
        {activeCartridge.sprites.map((s: SpriteData) => (
          <TilePreview
            key={s.id}
            sprite={s}
            palette={activeCartridge.hardware.palette}
            selected={s.id === activeTileSpriteId}
            onClick={() => setActiveTileSpriteId(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
