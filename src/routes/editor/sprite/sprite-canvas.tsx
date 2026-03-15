import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { useStore } from "@/store";

function floodFill(
  pixels: number[],
  w: number,
  h: number,
  x: number,
  y: number,
  target: number,
  fill: number,
) {
  if (target === fill) return;
  const stack = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    if (pixels[cy * w + cx] !== target) continue;
    pixels[cy * w + cx] = fill;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

function bresenham(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const points: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let cx = x0;
  let cy = y0;
  while (true) {
    points.push([cx, cy]);
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; cx += sx; }
    if (e2 <= dx) { err += dx; cy += sy; }
  }
  return points;
}

export interface SpriteCanvasHandle {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface SpriteCanvasProps {
  onHover?: (coords: [number, number] | null) => void;
}

export const SpriteCanvas = forwardRef<SpriteCanvasHandle, SpriteCanvasProps>(
  function SpriteCanvas({ onHover }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
      activeCartridge,
      selectedSpriteId,
      activePaletteIndex,
      spriteTool,
      spriteZoom,
      updateActiveCartridge,
      setActivePaletteIndex,
      setSpriteTool,
    } = useStore();

    const sprite = activeCartridge?.sprites[selectedSpriteId];

    const [hoveredPixel, setHoveredPixel] = useState<[number, number] | null>(null);
    const [linePreview, setLinePreview] = useState<[number, number][]>([]);

    // Undo / redo stacks (hold pixel states before each stroke)
    const undoStack = useRef<number[][]>([]);
    const redoStack = useRef<number[][]>([]);
    const strokeStart = useRef<number[] | null>(null);
    const lineStart = useRef<[number, number] | null>(null);
    const isDrawing = useRef(false);

    // Reset history when switching sprite
    useEffect(() => {
      undoStack.current = [];
      redoStack.current = [];
    }, [selectedSpriteId]);

    const applyPixels = useCallback(
      (pixels: number[]) => {
        if (!activeCartridge) return;
        const sprites = activeCartridge.sprites.map((s, i) =>
          i === selectedSpriteId ? { ...s, pixels } : s,
        );
        updateActiveCartridge({ sprites });
      },
      [activeCartridge, selectedSpriteId, updateActiveCartridge],
    );

    const undo = useCallback(() => {
      if (!undoStack.current.length || !sprite) return;
      redoStack.current.push([...sprite.pixels]);
      applyPixels(undoStack.current.pop()!);
    }, [sprite, applyPixels]);

    const redo = useCallback(() => {
      if (!redoStack.current.length || !sprite) return;
      undoStack.current.push([...sprite.pixels]);
      applyPixels(redoStack.current.pop()!);
    }, [sprite, applyPixels]);

    useImperativeHandle(ref, () => ({
      undo,
      redo,
      canUndo: () => undoStack.current.length > 0,
      canRedo: () => redoStack.current.length > 0,
    }));

    const draw = useCallback(() => {
      if (!canvasRef.current || !sprite || !activeCartridge) return;
      const ctx = canvasRef.current.getContext("2d")!;
      const { width, height, pixels } = sprite;
      const palette = activeCartridge.hardware.palette;
      const z = spriteZoom;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Checkerboard for transparency
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          ctx.fillStyle = (px + py) % 2 === 0 ? "#1c1c2e" : "#151525";
          ctx.fillRect(px * z, py * z, z, z);
        }
      }

      // Pixels
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const c = pixels[py * width + px];
          if (c === 0) continue;
          ctx.fillStyle = palette[c] ?? "#000";
          ctx.fillRect(px * z, py * z, z, z);
        }
      }

      // Line preview overlay
      if (linePreview.length > 0) {
        const previewColor = palette[activePaletteIndex] ?? "#fff";
        ctx.globalAlpha = 0.85;
        for (const [px, py] of linePreview) {
          ctx.fillStyle = previewColor;
          ctx.fillRect(px * z, py * z, z, z);
        }
        ctx.globalAlpha = 1;
      }

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let py = 0; py <= height; py++) {
        ctx.beginPath();
        ctx.moveTo(0, py * z);
        ctx.lineTo(width * z, py * z);
        ctx.stroke();
      }
      for (let px = 0; px <= width; px++) {
        ctx.beginPath();
        ctx.moveTo(px * z, 0);
        ctx.lineTo(px * z, height * z);
        ctx.stroke();
      }

      // Hover highlight
      if (hoveredPixel) {
        const [hx, hy] = hoveredPixel;
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hx * z + 0.75, hy * z + 0.75, z - 1.5, z - 1.5);
      }
    }, [sprite, activeCartridge, spriteZoom, hoveredPixel, linePreview, activePaletteIndex]);

    useEffect(() => {
      draw();
    }, [draw]);

    // Keyboard shortcuts
    useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.ctrlKey || e.metaKey) {
          if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
          if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); return; }
        }
        switch (e.key.toLowerCase()) {
          case "p": setSpriteTool("pencil"); break;
          case "e": setSpriteTool("eraser"); break;
          case "f": setSpriteTool("fill"); break;
          case "i": setSpriteTool("eyedropper"); break;
          case "l": setSpriteTool("line"); break;
        }
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo, setSpriteTool]);

    function getPixelCoords(e: React.MouseEvent): [number, number] | null {
      if (!canvasRef.current || !sprite) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / spriteZoom);
      const y = Math.floor((e.clientY - rect.top) / spriteZoom);
      if (x < 0 || x >= sprite.width || y < 0 || y >= sprite.height) return null;
      return [x, y];
    }

    function commitPixels(newPixels: number[]) {
      if (strokeStart.current) {
        undoStack.current.push(strokeStart.current);
        redoStack.current = [];
        strokeStart.current = null;
      }
      applyPixels(newPixels);
    }

    function applyToolAt(coords: [number, number]) {
      if (!sprite || !activeCartridge) return;
      const [x, y] = coords;
      const newPixels = [...sprite.pixels];
      const idx = y * sprite.width + x;

      if (spriteTool === "pencil") {
        newPixels[idx] = activePaletteIndex;
      } else if (spriteTool === "eraser") {
        newPixels[idx] = 0;
      } else if (spriteTool === "eyedropper") {
        setActivePaletteIndex(newPixels[idx]);
        strokeStart.current = null;
        return;
      } else if (spriteTool === "fill") {
        floodFill(newPixels, sprite.width, sprite.height, x, y, newPixels[idx], activePaletteIndex);
        commitPixels(newPixels);
        return;
      } else {
        return;
      }

      applyPixels(newPixels);
    }

    if (!sprite || !activeCartridge) return null;

    const getCursor = () => {
      if (spriteTool === "eyedropper") return "crosshair";
      if (spriteTool === "eraser") return "cell";
      return "crosshair";
    };

    return (
      <canvas
        ref={canvasRef}
        width={sprite.width * spriteZoom}
        height={sprite.height * spriteZoom}
        className="border border-white/10"
        style={{ imageRendering: "pixelated", cursor: getCursor() }}
        onMouseDown={(e) => {
          isDrawing.current = true;
          const coords = getPixelCoords(e);
          if (!coords) return;

          if (spriteTool === "line") {
            strokeStart.current = [...sprite.pixels];
            lineStart.current = coords;
            setLinePreview([coords]);
            return;
          }

          strokeStart.current = [...sprite.pixels];
          applyToolAt(coords);
        }}
        onMouseMove={(e) => {
          const coords = getPixelCoords(e);
          setHoveredPixel(coords);
          onHover?.(coords);

          if (!isDrawing.current) return;

          if (spriteTool === "line" && lineStart.current) {
            if (coords) {
              setLinePreview(
                bresenham(lineStart.current[0], lineStart.current[1], coords[0], coords[1]),
              );
            }
            return;
          }

          if ((spriteTool === "pencil" || spriteTool === "eraser") && coords) {
            applyToolAt(coords);
          }
        }}
        onMouseUp={(e) => {
          if (spriteTool === "line" && lineStart.current && isDrawing.current) {
            const coords = getPixelCoords(e);
            if (coords && sprite) {
              const newPixels = [...sprite.pixels];
              const points = bresenham(
                lineStart.current[0],
                lineStart.current[1],
                coords[0],
                coords[1],
              );
              for (const [px, py] of points) {
                newPixels[py * sprite.width + px] = activePaletteIndex;
              }
              commitPixels(newPixels);
            } else {
              strokeStart.current = null;
            }
            lineStart.current = null;
            setLinePreview([]);
          } else if (spriteTool === "pencil" || spriteTool === "eraser") {
            // Finalize stroke — push history
            if (strokeStart.current && sprite) {
              undoStack.current.push(strokeStart.current);
              redoStack.current = [];
              strokeStart.current = null;
            }
          } else {
            strokeStart.current = null;
          }
          isDrawing.current = false;
        }}
        onMouseLeave={() => {
          setHoveredPixel(null);
          onHover?.(null);
          if (spriteTool === "line" && lineStart.current) {
            lineStart.current = null;
            setLinePreview([]);
            strokeStart.current = null;
          }
          isDrawing.current = false;
        }}
      />
    );
  },
);
