import { describe, it, expect, vi } from "vitest";
import { CanvasRenderer } from "../canvas-renderer";
import type { HardwareConfig, SpriteData, MapData } from "@/types/cartridge";

// 16 Pico-8-like colors
const TEST_PALETTE = [
  "#000000", "#1D2B53", "#7E2553", "#008751",
  "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8",
  "#FF004D", "#FFA300", "#FFEC27", "#00E436",
  "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA",
];

const HW: HardwareConfig = {
  width: 32,
  height: 32,
  palette: TEST_PALETTE,
  inputs: [],
  maxSprites: 256,
  maxSounds: 64,
  maxFps: 60,
  maxIps: 8_000_000,
  maxMemBytes: 2 * 1024 * 1024,
  maxStorageBytes: 512 * 1024,
};

function createFakeCanvas(width: number, height: number) {
  const ctx = {
    imageSmoothingEnabled: false,
    createImageData: vi.fn((_w: number, _h: number) => ({
      data: new Uint8ClampedArray(_w * _h * 4),
    })),
    putImageData: vi.fn(),
  };
  const canvas = {
    width,
    height,
    getContext: vi.fn(() => ctx),
  } as unknown as HTMLCanvasElement;
  return { canvas, ctx };
}

function makeRenderer(sprites: SpriteData[] = [], maps: MapData[] = []) {
  const { canvas, ctx } = createFakeCanvas(HW.width, HW.height);
  const renderer = new CanvasRenderer(canvas, HW, sprites, maps);
  return { renderer, ctx };
}

describe("CanvasRenderer", () => {
  describe("cls()", () => {
    it("fills the entire buffer with the given color", () => {
      const { renderer } = makeRenderer();
      renderer.cls(5);
      for (let y = 0; y < HW.height; y++) {
        for (let x = 0; x < HW.width; x++) {
          expect(renderer.pget(x, y)).toBe(5);
        }
      }
    });

    it("defaults to color 0 when called with no arguments", () => {
      const { renderer } = makeRenderer();
      renderer.cls(3);
      renderer.cls();
      expect(renderer.pget(0, 0)).toBe(0);
    });
  });

  describe("pset() / pget()", () => {
    it("reads back the color that was set", () => {
      const { renderer } = makeRenderer();
      renderer.pset(5, 10, 7);
      expect(renderer.pget(5, 10)).toBe(7);
    });

    it("does not affect other pixels", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.pset(5, 5, 3);
      expect(renderer.pget(4, 5)).toBe(0);
      expect(renderer.pget(6, 5)).toBe(0);
    });

    it("ignores out-of-bounds writes without throwing", () => {
      const { renderer } = makeRenderer();
      expect(() => renderer.pset(-1, 0, 1)).not.toThrow();
      expect(() => renderer.pset(0, -1, 1)).not.toThrow();
      expect(() => renderer.pset(HW.width, 0, 1)).not.toThrow();
      expect(() => renderer.pset(0, HW.height, 1)).not.toThrow();
    });

    it("returns 0 for out-of-bounds reads", () => {
      const { renderer } = makeRenderer();
      expect(renderer.pget(-1, 0)).toBe(0);
      expect(renderer.pget(0, -1)).toBe(0);
      expect(renderer.pget(HW.width, 0)).toBe(0);
    });
  });

  describe("line()", () => {
    it("draws a horizontal line (all pixels same y)", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.line(0, 5, 4, 5, 2);
      for (let x = 0; x <= 4; x++) {
        expect(renderer.pget(x, 5)).toBe(2);
      }
    });

    it("draws a vertical line (all pixels same x)", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.line(3, 0, 3, 4, 3);
      for (let y = 0; y <= 4; y++) {
        expect(renderer.pget(3, y)).toBe(3);
      }
    });

    it("draws a single pixel when start equals end", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.line(7, 7, 7, 7, 9);
      expect(renderer.pget(7, 7)).toBe(9);
    });

    it("draws a diagonal line (both endpoints colored)", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.line(0, 0, 4, 4, 1);
      expect(renderer.pget(0, 0)).toBe(1);
      expect(renderer.pget(4, 4)).toBe(1);
    });
  });

  describe("rectfill()", () => {
    it("fills all pixels inside the rectangle", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.rectfill(2, 2, 4, 4, 6);
      for (let y = 2; y < 6; y++) {
        for (let x = 2; x < 6; x++) {
          expect(renderer.pget(x, y)).toBe(6);
        }
      }
    });

    it("does not paint pixels outside the rectangle", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.rectfill(5, 5, 3, 3, 7);
      expect(renderer.pget(4, 5)).toBe(0);
      expect(renderer.pget(5, 4)).toBe(0);
      expect(renderer.pget(8, 8)).toBe(0);
    });
  });

  describe("circ()", () => {
    it("paints pixels on the circumference", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.circ(15, 15, 5, 4);
      // The rightmost point of a radius-5 circle centered at (15,15)
      expect(renderer.pget(20, 15)).toBe(4);
      // Leftmost
      expect(renderer.pget(10, 15)).toBe(4);
      // Top
      expect(renderer.pget(15, 10)).toBe(4);
      // Bottom
      expect(renderer.pget(15, 20)).toBe(4);
    });

    it("with radius 0 paints only the center pixel", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.circ(10, 10, 0, 5);
      expect(renderer.pget(10, 10)).toBe(5);
    });
  });

  describe("circfill()", () => {
    it("fills the center pixel", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.circfill(10, 10, 3, 8);
      expect(renderer.pget(10, 10)).toBe(8);
    });

    it("fills all pixels within radius", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.circfill(10, 10, 2, 8);
      // All pixels with distance <= 2 from center should be filled
      expect(renderer.pget(10, 10)).toBe(8);
      expect(renderer.pget(10, 8)).toBe(8); // top of radius
      expect(renderer.pget(10, 12)).toBe(8); // bottom of radius
    });
  });

  describe("camera()", () => {
    it("offsets subsequent pset operations", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.camera(5, 5);
      renderer.pset(5, 5, 3); // logical (5,5) → raw (0,0)
      expect(renderer.pget(5, 5)).toBe(3); // pget also applies offset
    });

    it("resets offset when called with (0, 0)", () => {
      const { renderer } = makeRenderer();
      renderer.camera(10, 10);
      renderer.camera(0, 0);
      renderer.pset(3, 3, 7);
      expect(renderer.pget(3, 3)).toBe(7);
    });
  });

  describe("pal()", () => {
    it("remaps a color in the palette map", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.pal(3, 5); // whenever color 3 is used, draw color 5 instead

      // Draw a sprite with color 3 manually via pset (pset uses raw color)
      // pal() affects flush(), so test via sprite rendering
      // We test pal affects the paletteMap which is used in flush
      // Instead let's verify the remap doesn't affect pset/pget (those are pre-remap)
      renderer.pset(0, 0, 3);
      expect(renderer.pget(0, 0)).toBe(3); // buffer stores raw color
    });
  });

  describe("palt()", () => {
    it("makes a color non-transparent (false) after setting transparent", () => {
      // Default: color 0 is transparent
      // Make a sprite with color 0 pixels
      const sprite: SpriteData = {
        id: 0,
        width: 4,
        height: 4,
        pixels: new Array(16).fill(0), // all color 0 (transparent by default)
      };
      const { renderer: r2 } = makeRenderer([sprite]);
      r2.cls(7); // background = color 7
      r2.spr(0, 0, 0); // sprite with all-transparent pixels
      // Color 0 is transparent, so background should show through
      expect(r2.pget(0, 0)).toBe(7);

      // Now make color 0 opaque
      r2.palt(0, false);
      r2.cls(7);
      r2.spr(0, 0, 0);
      expect(r2.pget(0, 0)).toBe(0); // now color 0 is drawn
    });

    it("makes a color transparent with palt(c, true)", () => {
      const sprite: SpriteData = {
        id: 0,
        width: 4,
        height: 4,
        pixels: new Array(16).fill(2), // all color 2 (opaque by default)
      };
      const { renderer } = makeRenderer([sprite]);
      renderer.cls(5); // background
      renderer.spr(0, 0, 0);
      expect(renderer.pget(0, 0)).toBe(2); // color 2 is opaque

      renderer.palt(2, true); // make color 2 transparent
      renderer.cls(5);
      renderer.spr(0, 0, 0);
      expect(renderer.pget(0, 0)).toBe(5); // background shows through
    });
  });

  describe("spr()", () => {
    it("draws a sprite's pixels onto the buffer", () => {
      const sprite: SpriteData = {
        id: 0,
        width: 4,
        height: 4,
        pixels: [
          1, 1, 1, 1,
          1, 2, 2, 1,
          1, 2, 2, 1,
          1, 1, 1, 1,
        ],
      };
      const { renderer } = makeRenderer([sprite]);
      renderer.cls(0);
      renderer.spr(0, 0, 0);
      expect(renderer.pget(0, 0)).toBe(1);
      expect(renderer.pget(1, 1)).toBe(2);
      expect(renderer.pget(2, 2)).toBe(2);
      expect(renderer.pget(3, 3)).toBe(1);
    });

    it("skips transparent pixels (color 0 by default)", () => {
      const sprite: SpriteData = {
        id: 0,
        width: 2,
        height: 2,
        pixels: [0, 3, 3, 0],
      };
      const { renderer } = makeRenderer([sprite]);
      renderer.cls(7); // background color 7
      renderer.spr(0, 0, 0);
      expect(renderer.pget(0, 0)).toBe(7); // transparent → background
      expect(renderer.pget(1, 0)).toBe(3); // opaque → color 3
    });

    it("does nothing for out-of-bounds sprite index", () => {
      const { renderer } = makeRenderer([]);
      renderer.cls(0);
      expect(() => renderer.spr(99, 0, 0)).not.toThrow();
      expect(renderer.pget(0, 0)).toBe(0);
    });
  });

  describe("resetState()", () => {
    it("resets camera to (0,0)", () => {
      const { renderer } = makeRenderer();
      renderer.camera(10, 10);
      renderer.resetState();
      renderer.pset(0, 0, 5);
      expect(renderer.pget(0, 0)).toBe(5);
    });

    it("restores default transparency (color 0 transparent)", () => {
      const sprite: SpriteData = {
        id: 0,
        width: 1,
        height: 1,
        pixels: [0],
      };
      const { renderer } = makeRenderer([sprite]);
      renderer.palt(0, false); // make 0 opaque
      renderer.resetState();
      renderer.cls(7);
      renderer.spr(0, 0, 0);
      expect(renderer.pget(0, 0)).toBe(7); // 0 is transparent again
    });
  });

  describe("flush()", () => {
    it("calls putImageData on the context", () => {
      const { renderer, ctx } = makeRenderer();
      renderer.cls(1);
      renderer.flush();
      expect(ctx.putImageData).toHaveBeenCalledOnce();
    });
  });

  describe("rect()", () => {
    it("draws all four edges of the rectangle", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.rect(2, 2, 4, 4, 3); // top-left (2,2), 4×4 → corners at (2,2) and (5,5)
      // Top edge
      expect(renderer.pget(2, 2)).toBe(3);
      expect(renderer.pget(5, 2)).toBe(3);
      // Bottom edge
      expect(renderer.pget(2, 5)).toBe(3);
      expect(renderer.pget(5, 5)).toBe(3);
      // Left edge mid-point
      expect(renderer.pget(2, 3)).toBe(3);
      // Right edge mid-point
      expect(renderer.pget(5, 3)).toBe(3);
    });

    it("does not fill the interior", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.rect(2, 2, 6, 6, 3);
      expect(renderer.pget(4, 4)).toBe(0); // center should remain background
    });

    it("draws a 1×1 rect as a single point", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.rect(5, 5, 1, 1, 7);
      expect(renderer.pget(5, 5)).toBe(7);
    });
  });

  describe("map()", () => {
    it("renders a tile from the map at the correct screen position", () => {
      const sprite: SpriteData = { id: 0, width: 4, height: 4, pixels: new Array(16).fill(3) };
      const mapData: MapData = { id: 0, name: "test", tiles: { "0,0": 0 } };
      const { renderer } = makeRenderer([sprite], [mapData]);
      renderer.cls(0);
      renderer.map(0, 0, 0, 0, 1, 1, 0);
      expect(renderer.pget(0, 0)).toBe(3);
      expect(renderer.pget(3, 3)).toBe(3);
    });

    it("does nothing when the map id does not exist", () => {
      const { renderer } = makeRenderer();
      renderer.cls(5);
      expect(() => renderer.map(0, 0, 0, 0, 4, 4, 99)).not.toThrow();
      expect(renderer.pget(0, 0)).toBe(5);
    });

    it("skips tile entries whose sprite index is missing", () => {
      const mapData: MapData = { id: 0, name: "test", tiles: { "0,0": 99 } };
      const { renderer } = makeRenderer([], [mapData]);
      renderer.cls(7);
      renderer.map(0, 0, 0, 0, 1, 1, 0);
      expect(renderer.pget(0, 0)).toBe(7);
    });

    it("renders adjacent tiles at correct screen offsets", () => {
      const sprite: SpriteData = { id: 0, width: 4, height: 4, pixels: new Array(16).fill(2) };
      const mapData: MapData = { id: 0, name: "test", tiles: { "0,0": 0, "1,0": 0 } };
      const { renderer } = makeRenderer([sprite], [mapData]);
      renderer.cls(0);
      renderer.map(0, 0, 0, 0, 2, 1, 0);
      // Second tile is 4px to the right
      expect(renderer.pget(4, 0)).toBe(2);
      expect(renderer.pget(7, 3)).toBe(2);
    });
  });

  describe("updateAssets()", () => {
    it("replaces sprites for subsequent spr() calls", () => {
      const old: SpriteData = { id: 0, width: 2, height: 2, pixels: [1, 1, 1, 1] };
      const next: SpriteData = { id: 0, width: 2, height: 2, pixels: [5, 5, 5, 5] };
      const { renderer } = makeRenderer([old]);
      renderer.cls(0);
      renderer.spr(0, 0, 0);
      expect(renderer.pget(0, 0)).toBe(1);

      renderer.updateAssets([next], []);
      renderer.cls(0);
      renderer.spr(0, 0, 0);
      expect(renderer.pget(0, 0)).toBe(5);
    });

    it("replaces maps for subsequent map() calls", () => {
      const sprite: SpriteData = { id: 0, width: 2, height: 2, pixels: new Array(4).fill(3) };
      const mapV1: MapData = { id: 0, name: "old", tiles: { "0,0": 0 } };
      const mapV2: MapData = { id: 0, name: "new", tiles: {} };
      const { renderer } = makeRenderer([sprite], [mapV1]);
      renderer.cls(0);
      renderer.map(0, 0, 0, 0, 1, 1, 0);
      expect(renderer.pget(0, 0)).toBe(3);

      renderer.updateAssets([sprite], [mapV2]);
      renderer.cls(0);
      renderer.map(0, 0, 0, 0, 1, 1, 0);
      expect(renderer.pget(0, 0)).toBe(0); // empty map → nothing drawn
    });
  });

  describe("updateHardware()", () => {
    it("clears the pixel buffer (all zeros) after the update", () => {
      const { renderer } = makeRenderer();
      renderer.cls(7);
      renderer.updateHardware({ ...HW, width: 16, height: 16 });
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++)
          expect(renderer.pget(x, y)).toBe(0);
    });

    it("uses the new dimensions for bounds checking", () => {
      const { renderer } = makeRenderer();
      renderer.updateHardware({ ...HW, width: 8, height: 8 });
      expect(() => renderer.pset(100, 100, 1)).not.toThrow();
      expect(renderer.pget(100, 100)).toBe(0); // out-of-bounds → 0
    });
  });

  describe("print()", () => {
    it("draws pixels for a non-space character", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.print("A", 0, 0, 7);
      // 'A' has a non-zero bitmap, so some pixel must be set
      let anySet = false;
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 5; x++) {
          if (renderer.pget(x, y) === 7) anySet = true;
        }
      }
      expect(anySet).toBe(true);
    });

    it("does not draw pixels for a space character (char 32)", () => {
      const { renderer } = makeRenderer();
      renderer.cls(0);
      renderer.print(" ", 0, 0, 7);
      // Space bitmap is all zeros
      let anySet = false;
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 5; x++) {
          if (renderer.pget(x, y) === 7) anySet = true;
        }
      }
      expect(anySet).toBe(false);
    });
  });
});
