import { useEffect, useRef } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { InlineEdit } from "../inline-edit";
import type { SpriteData } from "@/types/cartridge";

const THUMB = 28;

function SpriteThumb({
  sprite,
  palette,
}: {
  sprite: SpriteData;
  palette: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoom = THUMB / sprite.width;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, THUMB, THUMB);
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
    <canvas
      ref={canvasRef}
      width={THUMB}
      height={THUMB}
      className="shrink-0 border border-white/10"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function SpriteList() {
  const {
    activeCartridge,
    selectedSpriteId,
    setSelectedSpriteId,
    updateActiveCartridge,
  } = useStore();

  if (!activeCartridge) return null;
  const { sprites, hardware } = activeCartridge;

  function addSprite() {
    if (!activeCartridge) return;
    const newId = activeCartridge.sprites.length;
    if (newId >= hardware.maxSprites) return;
    const sz = hardware.spriteSize ?? 8;
    updateActiveCartridge({
      sprites: [
        ...activeCartridge.sprites,
        {
          id: newId,
          width: sz,
          height: sz,
          pixels: new Array(sz * sz).fill(0),
        },
      ],
    });
    setSelectedSpriteId(newId);
  }

  function deleteSprite(id: number) {
    if (!activeCartridge) return;
    const newSprites = sprites
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, id: i }));
    updateActiveCartridge({ sprites: newSprites });
    if (selectedSpriteId >= newSprites.length)
      setSelectedSpriteId(newSprites.length - 1);
    else if (selectedSpriteId === id) setSelectedSpriteId(Math.max(0, id - 1));
  }

  function commitRename(id: number, name: string) {
    if (!activeCartridge) return;
    updateActiveCartridge({
      sprites: activeCartridge.sprites.map((s) =>
        s.id === id ? { ...s, name: name.trim() || undefined } : s,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-300">
          Sprites ({sprites.length}/{hardware.maxSprites})
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={addSprite}
          disabled={sprites.length >= hardware.maxSprites}
          className="text-zinc-400 hover:text-zinc-300"
          title="Add sprite"
        >
          <PlusIcon size={10} />
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 overflow-hidden">
        {sprites.map((s: SpriteData) => (
          <div
            key={s.id}
            className={`group flex items-center gap-1 border px-1.5 py-1 transition ${
              s.id === selectedSpriteId
                ? "border-violet-500/40 bg-violet-600/10"
                : "border-transparent hover:border-white/8 hover:bg-white/4"
            }`}
          >
            {/* Thumbnail */}
            <button
              className="shrink-0"
              onClick={() => setSelectedSpriteId(s.id)}
            >
              <SpriteThumb sprite={s} palette={hardware.palette} />
            </button>

            {/* Info */}
            <div
              className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5"
              onClick={() => setSelectedSpriteId(s.id)}
            >
              <div className="flex w-full min-w-0 items-center gap-1 overflow-hidden">
                <span
                  className={`shrink-0 font-mono text-[9px] ${
                    s.id === selectedSpriteId
                      ? "text-violet-400"
                      : "text-zinc-300"
                  }`}
                >
                  #{s.id}
                </span>
                <InlineEdit
                  value={s.name ?? ""}
                  onCommit={(name) => commitRename(s.id, name)}
                  className={`text-[11px] ${
                    s.id === selectedSpriteId
                      ? "text-zinc-200"
                      : "text-zinc-300"
                  }`}
                  onDelete={() => {
                    deleteSprite(s.id);
                  }}
                />
              </div>
              <span className="font-mono text-[9px] text-zinc-400">
                {s.width}×{s.height}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
