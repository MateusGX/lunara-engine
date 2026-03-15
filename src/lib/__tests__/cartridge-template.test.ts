import { describe, it, expect } from "vitest";
import {
  createBlankCartridge,
  createDefaultCartridge,
  createPlatformerTemplate,
} from "../cartridge-template";

describe("createBlankCartridge", () => {
  it("creates a cartridge with the given name", () => {
    const c = createBlankCartridge("My Game");
    expect(c.meta.name).toBe("My Game");
  });

  it("sets the author field", () => {
    const c = createBlankCartridge("Test", "Alice");
    expect(c.meta.author).toBe("Alice");
  });

  it("defaults author to empty string when not provided", () => {
    const c = createBlankCartridge("Test");
    expect(c.meta.author).toBe("");
  });

  it("generates a non-empty UUID for meta.id", () => {
    const c = createBlankCartridge("Test");
    expect(c.meta.id).toBeTruthy();
    expect(c.meta.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("generates unique IDs for each call", () => {
    const a = createBlankCartridge("A");
    const b = createBlankCartridge("B");
    expect(a.meta.id).not.toBe(b.meta.id);
  });

  it("sets version to 1.0.0", () => {
    const c = createBlankCartridge("Test");
    expect(c.meta.version).toBe("1.0.0");
  });

  it("has matching created and updated timestamps", () => {
    const before = Date.now();
    const c = createBlankCartridge("Test");
    const after = Date.now();
    expect(c.meta.created).toBeGreaterThanOrEqual(before);
    expect(c.meta.created).toBeLessThanOrEqual(after);
    expect(c.meta.created).toBe(c.meta.updated);
  });

  it("includes hardware config with 16-color palette", () => {
    const c = createBlankCartridge("Test");
    expect(c.hardware.palette).toHaveLength(16);
    expect(c.hardware.width).toBe(128);
    expect(c.hardware.height).toBe(128);
  });

  it("includes default input bindings (6 buttons)", () => {
    const c = createBlankCartridge("Test");
    expect(c.hardware.inputs).toHaveLength(6);
  });

  it("has one script named 'main' with _init, _update, _draw", () => {
    const c = createBlankCartridge("Test");
    expect(c.scripts).toHaveLength(1);
    expect(c.scripts[0].name).toBe("main");
    expect(c.scripts[0].code).toContain("_init");
    expect(c.scripts[0].code).toContain("_update");
    expect(c.scripts[0].code).toContain("_draw");
  });

  it("includes one blank sprite (8x8 all zeros)", () => {
    const c = createBlankCartridge("Test");
    expect(c.sprites).toHaveLength(1);
    expect(c.sprites[0].width).toBe(8);
    expect(c.sprites[0].height).toBe(8);
    expect(c.sprites[0].pixels).toHaveLength(64);
    expect(c.sprites[0].pixels.every((p) => p === 0)).toBe(true);
  });

  it("includes one empty map", () => {
    const c = createBlankCartridge("Test");
    expect(c.maps).toHaveLength(1);
    expect(c.maps[0].tiles).toEqual({});
  });

  it("includes one sound slot", () => {
    const c = createBlankCartridge("Test");
    expect(c.sounds).toHaveLength(1);
    expect(c.sounds[0].notes).toHaveLength(32);
  });
});

describe("createDefaultCartridge", () => {
  it("creates a cartridge with the given name and author", () => {
    const c = createDefaultCartridge("Hello World", "Bob");
    expect(c.meta.name).toBe("Hello World");
    expect(c.meta.author).toBe("Bob");
  });

  it("includes player sprite with non-zero pixels", () => {
    const c = createDefaultCartridge("Test");
    expect(c.sprites).toHaveLength(1);
    expect(c.sprites[0].pixels.some((p) => p !== 0)).toBe(true);
  });

  it("script includes game state machine (menu/play/pause)", () => {
    const c = createDefaultCartridge("Test");
    const code = c.scripts[0].code;
    expect(code).toContain("menu");
    expect(code).toContain("play");
    expect(code).toContain("pause");
  });

  it("generates a unique UUID", () => {
    const c = createDefaultCartridge("Test");
    expect(c.meta.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe("createPlatformerTemplate", () => {
  it("creates a cartridge with two sprites (tile + player)", () => {
    const c = createPlatformerTemplate("Platformer");
    expect(c.sprites).toHaveLength(2);
    expect(c.sprites[0].name).toBe("tile");
    expect(c.sprites[1].name).toBe("player");
  });

  it("creates a map with ground tiles (rows 14-15)", () => {
    const c = createPlatformerTemplate("Platformer");
    const tiles = c.maps[0].tiles;
    // Ground row 14 should have tiles at columns 0-15
    for (let col = 0; col < 16; col++) {
      expect(tiles[`${col},14`]).toBe(0);
      expect(tiles[`${col},15`]).toBe(0);
    }
  });

  it("creates platform 1 at row 10, cols 2-6", () => {
    const c = createPlatformerTemplate("Platformer");
    const tiles = c.maps[0].tiles;
    for (let col = 2; col <= 6; col++) {
      expect(tiles[`${col},10`]).toBe(0);
    }
    // col 1 should not be part of platform 1
    expect(tiles["1,10"]).toBeUndefined();
  });

  it("creates platform 2 at row 7, cols 9-13", () => {
    const c = createPlatformerTemplate("Platformer");
    const tiles = c.maps[0].tiles;
    for (let col = 9; col <= 13; col++) {
      expect(tiles[`${col},7`]).toBe(0);
    }
    expect(tiles["8,7"]).toBeUndefined();
  });

  it("script includes physics constants (GRAVITY, SPEED, JUMP)", () => {
    const c = createPlatformerTemplate("Test");
    const code = c.scripts[0].code;
    expect(code).toContain("GRAVITY");
    expect(code).toContain("SPEED");
    expect(code).toContain("JUMP");
  });

  it("generates a unique UUID", () => {
    const c = createPlatformerTemplate("Test");
    expect(c.meta.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
