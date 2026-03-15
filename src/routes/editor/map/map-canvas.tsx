import { useRef, useEffect, useCallback, useState } from "react";
import { useStore } from "@/store";

const TILE_SIZE = 8;

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    activeCartridge,
    selectedMapId,
    activeTileSpriteId,
    mapTool,
    mapZoom,
    updateActiveCartridge,
    setMapTool,
  } = useStore();

  const map = activeCartridge?.maps[selectedMapId];

  const [hoverTile, setHoverTile] = useState<[number, number] | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const isDrawing = useRef(false);
  const spaceHeld = useRef(false);
  const cursorRef = useRef<"crosshair" | "grab" | "grabbing">("crosshair");
  // Track hoverTile in a ref so draw() always sees the latest value
  const hoverTileRef = useRef<[number, number] | null>(null);

  const setCursor = (c: "crosshair" | "grab" | "grabbing") => {
    cursorRef.current = c;
    if (containerRef.current) containerRef.current.style.cursor = c;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeCartridge) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const { x: ox, y: oy } = panRef.current;
    const palette = activeCartridge.hardware.palette;
    const sprites = activeCartridge.sprites;
    const tiles = map?.tiles ?? {};
    const cellSize = TILE_SIZE * mapZoom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0d0d14";
    ctx.fillRect(0, 0, W, H);

    const startCol = Math.floor(-ox / cellSize) - 1;
    const endCol = Math.ceil((W - ox) / cellSize) + 1;
    const startRow = Math.floor(-oy / cellSize) - 1;
    const endRow = Math.ceil((H - oy) / cellSize) + 1;

    // Draw placed tiles
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const sprId = tiles[`${col},${row}`];
        if (sprId === undefined || sprId < 0) continue;
        const sprite = sprites[sprId];
        if (!sprite) continue;
        const sx = ox + col * cellSize;
        const sy = oy + row * cellSize;
        for (let py = 0; py < sprite.height; py++) {
          for (let px = 0; px < sprite.width; px++) {
            const c = sprite.pixels[py * sprite.width + px];
            if (c === 0) continue;
            ctx.fillStyle = palette[c] ?? "#000";
            ctx.fillRect(sx + px * mapZoom, sy + py * mapZoom, mapZoom, mapZoom);
          }
        }
      }
    }

    // Hover ghost preview (paint tool only)
    const ht = hoverTileRef.current;
    if (ht) {
      const [hcol, hrow] = ht;
      const sx = ox + hcol * cellSize;
      const sy = oy + hrow * cellSize;

      // Use store state captured in closure - read directly
      const currentTool = useStore.getState().mapTool;
      const currentTileId = useStore.getState().activeTileSpriteId;

      if (currentTool === "paint") {
        const sprite = sprites[currentTileId];
        if (sprite) {
          ctx.globalAlpha = 0.55;
          for (let py = 0; py < sprite.height; py++) {
            for (let px = 0; px < sprite.width; px++) {
              const c = sprite.pixels[py * sprite.width + px];
              if (c === 0) continue;
              ctx.fillStyle = palette[c] ?? "#000";
              ctx.fillRect(sx + px * mapZoom, sy + py * mapZoom, mapZoom, mapZoom);
            }
          }
          ctx.globalAlpha = 1;
        }
        // Highlight border
        ctx.strokeStyle = "rgba(139,92,246,0.8)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx + 0.75, sy + 0.75, cellSize - 1.5, cellSize - 1.5);
      } else if (currentTool === "erase") {
        ctx.strokeStyle = "rgba(239,68,68,0.8)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx + 0.75, sy + 0.75, cellSize - 1.5, cellSize - 1.5);
        // X mark
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + 4);
        ctx.lineTo(sx + cellSize - 4, sy + cellSize - 4);
        ctx.moveTo(sx + cellSize - 4, sy + 4);
        ctx.lineTo(sx + 4, sy + cellSize - 4);
        ctx.stroke();
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let col = startCol; col <= endCol; col++) {
      const x = Math.round(ox + col * cellSize) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let row = startRow; row <= endRow; row++) {
      const y = Math.round(oy + row * cellSize) + 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Origin axes
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    const originX = Math.round(ox) + 0.5;
    ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, H); ctx.stroke();
    const originY = Math.round(oy) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();
  }, [map, activeCartridge, mapZoom]);

  // Resize canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        spaceHeld.current = true;
        setCursor("grab");
        return;
      }
      switch (e.key.toLowerCase()) {
        case "p": setMapTool("paint"); break;
        case "e": setMapTool("erase"); break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeld.current = false;
        if (!isPanning.current) setCursor("crosshair");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setMapTool]);

  function mouseToTile(e: React.MouseEvent): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cellSize = TILE_SIZE * mapZoom;
    return [
      Math.floor((mx - panRef.current.x) / cellSize),
      Math.floor((my - panRef.current.y) / cellSize),
    ];
  }

  function applyTool(e: React.MouseEvent) {
    if (!map || !activeCartridge) return;
    const [col, row] = mouseToTile(e);
    const key = `${col},${row}`;
    const newTiles = { ...map.tiles };
    if (mapTool === "erase") {
      delete newTiles[key];
    } else {
      newTiles[key] = activeTileSpriteId;
    }
    updateActiveCartridge({
      maps: activeCartridge.maps.map((m, i) =>
        i === selectedMapId ? { ...m, tiles: newTiles } : m,
      ),
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button === 1 || spaceHeld.current) {
      e.preventDefault();
      isPanning.current = true;
      setCursor("grabbing");
      panStart.current = {
        mx: e.clientX,
        my: e.clientY,
        px: panRef.current.x,
        py: panRef.current.y,
      };
    } else if (e.button === 0) {
      isDrawing.current = true;
      applyTool(e);
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    const tile = mouseToTile(e);
    setHoverTile(tile);
    hoverTileRef.current = tile;
    if (isPanning.current) {
      panRef.current = {
        x: panStart.current.px + (e.clientX - panStart.current.mx),
        y: panStart.current.py + (e.clientY - panStart.current.my),
      };
    } else if (isDrawing.current) {
      applyTool(e);
    }
    draw();
  }

  function handleMouseUp() {
    isPanning.current = false;
    isDrawing.current = false;
    setCursor(spaceHeld.current ? "grab" : "crosshair");
  }

  function handleMouseLeave() {
    handleMouseUp();
    setHoverTile(null);
    hoverTileRef.current = null;
    draw();
  }

  // Reset pan when map changes
  useEffect(() => {
    panRef.current = { x: 0, y: 0 };
    draw();
  }, [selectedMapId, draw]);

  if (!map || !activeCartridge) return null;

  const tileCount = Object.keys(map.tiles).length;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ cursor: "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Status bar */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/6 bg-[#0d0d14]/80 px-3 py-1 backdrop-blur-sm">
        <span className="font-mono text-[10px] text-zinc-500">
          {hoverTile ? `col ${hoverTile[0]}, row ${hoverTile[1]}` : ""}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-700">
            {tileCount} tile{tileCount !== 1 ? "s" : ""}
          </span>
          <span className="font-mono text-[10px] text-zinc-700">
            {mapZoom}x
          </span>
        </div>
      </div>
    </div>
  );
}
