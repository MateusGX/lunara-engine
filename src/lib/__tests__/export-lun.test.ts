import { describe, it, expect, vi, beforeEach } from "vitest";
import { importLun, exportLun, exportFlat, calcStorageBytes } from "../export-lun";
import type { Cartridge } from "@/types/cartridge";

// Minimal valid cartridge for testing
function makeCartridge(overrides: Partial<Cartridge> = {}): Cartridge {
  return {
    meta: {
      id: "test-id-123",
      name: "Test Game",
      author: "Tester",
      description: "",
      version: "1.0.0",
      created: 1000,
      updated: 2000,
    },
    hardware: {
      width: 128,
      height: 128,
      palette: ["#000000", "#ffffff"],
      inputs: [],
      maxSprites: 256,
      maxSounds: 64,
      maxFps: 60,
      maxIps: 8_000_000,
      maxMemBytes: 2 * 1024 * 1024,
      maxStorageBytes: 512 * 1024,
    },
    scripts: [{ id: 0, name: "main", code: "-- test" }],
    sprites: [],
    maps: [],
    sounds: [],
    ...overrides,
  };
}

// Helper to create a File with JSON content
function makeFile(content: object | string, name = "test.lun"): File {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  return new File([text], name, { type: "application/json" });
}

describe("importLun", () => {
  it("parses a valid .lun file and returns a Cartridge", async () => {
    const cartridge = makeCartridge();
    const file = makeFile(cartridge);
    const result = await importLun(file);
    expect(result.meta.id).toBe("test-id-123");
    expect(result.meta.name).toBe("Test Game");
    expect(result.scripts).toHaveLength(1);
  });

  it("assigns a new UUID when meta.id is missing", async () => {
    const cartridge = makeCartridge();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (cartridge.meta as any).id;
    const file = makeFile(cartridge);
    const result = await importLun(file);
    expect(result.meta.id).toBeDefined();
    expect(result.meta.id.length).toBeGreaterThan(0);
  });

  it("handles backward-compat format with single 'code' field", async () => {
    const oldFormat = {
      meta: { id: "old-id", name: "Old Game", author: "" },
      hardware: makeCartridge().hardware,
      code: "-- legacy code",
      sprites: [],
      maps: [],
      sounds: [],
    };
    const file = makeFile(oldFormat);
    const result = await importLun(file);
    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0].name).toBe("main");
    expect(result.scripts[0].code).toBe("-- legacy code");
  });

  it("rejects on invalid JSON content", async () => {
    const file = makeFile("this is not json { broken");
    await expect(importLun(file)).rejects.toThrow("Invalid .lun file");
  });
});

describe("exportLun", () => {
  beforeEach(() => {
    // Mock DOM APIs used for download
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement,
    );
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
    vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);
  });

  it("triggers a download without throwing", () => {
    const cartridge = makeCartridge();
    expect(() => exportLun(cartridge)).not.toThrow();
  });

  it("uses the cartridge name (spaces replaced) as filename", () => {
    const cartridge = makeCartridge({ meta: { ...makeCartridge().meta, name: "My Cool Game" } });
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement,
    );
    exportLun(cartridge);
    expect(mockAnchor.download).toBe("My_Cool_Game.lun");
  });
});

describe("calcStorageBytes", () => {
  it("returns 0 for a cartridge with no assets", () => {
    const c = makeCartridge({ sprites: [], maps: [], scripts: [], sounds: [] });
    expect(calcStorageBytes(c)).toBe(0);
  });

  it("counts sprite pixels at 1 byte each", () => {
    const c = makeCartridge({
      sprites: [{ id: 0, width: 8, height: 8, pixels: new Array(64).fill(1) }],
      maps: [], scripts: [], sounds: [],
    });
    expect(calcStorageBytes(c)).toBe(64);
  });

  it("counts map tile entries at 9 bytes each", () => {
    const c = makeCartridge({
      sprites: [],
      maps: [{ id: 0, name: "M", tiles: { "0,0": 0, "1,0": 0, "2,0": 0 } }],
      scripts: [], sounds: [],
    });
    expect(calcStorageBytes(c)).toBe(27); // 3 × 9
  });

  it("counts script source at 1 byte per character", () => {
    const c = makeCartridge({
      sprites: [], maps: [],
      scripts: [{ id: 0, name: "main", code: "hello" }],
      sounds: [],
    });
    expect(calcStorageBytes(c)).toBe(5);
  });

  it("counts sound notes at 4 bytes each", () => {
    const c = makeCartridge({
      sprites: [], maps: [], scripts: [],
      sounds: [{ id: 0, name: "s", notes: new Array(8).fill({ note: null, volume: 1 }), steps: 8, tempo: 120, waveform: "square" }],
    });
    expect(calcStorageBytes(c)).toBe(32); // 8 × 4
  });

  it("sums all asset types together", () => {
    const c = makeCartridge({
      sprites: [{ id: 0, width: 4, height: 4, pixels: new Array(16).fill(0) }], // 16
      maps: [{ id: 0, name: "M", tiles: { "0,0": 0 } }],                        //  9
      scripts: [{ id: 0, name: "main", code: "abc" }],                           //  3
      sounds: [{ id: 0, name: "s", notes: new Array(4).fill({ note: null, volume: 1 }), steps: 4, tempo: 120, waveform: "square" }], // 16
    });
    expect(calcStorageBytes(c)).toBe(16 + 9 + 3 + 16);
  });

  it("accumulates across multiple sprites", () => {
    const c = makeCartridge({
      sprites: [
        { id: 0, width: 4, height: 4, pixels: new Array(16).fill(0) },
        { id: 1, width: 8, height: 8, pixels: new Array(64).fill(0) },
      ],
      maps: [], scripts: [], sounds: [],
    });
    expect(calcStorageBytes(c)).toBe(80);
  });

  it("counts tiles across multiple maps", () => {
    const c = makeCartridge({
      sprites: [], scripts: [], sounds: [],
      maps: [
        { id: 0, name: "A", tiles: { "0,0": 0, "1,0": 0 } },
        { id: 1, name: "B", tiles: { "0,0": 0 } },
      ],
    });
    expect(calcStorageBytes(c)).toBe(27); // (2 + 1) × 9
  });
});

describe("exportFlat", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement,
    );
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
    vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);
  });

  it("triggers a download without throwing", () => {
    const cartridge = makeCartridge();
    expect(() => exportFlat(cartridge)).not.toThrow();
  });

  it("uses .lunx extension", () => {
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement,
    );
    const cartridge = makeCartridge();
    exportFlat(cartridge);
    expect(mockAnchor.download).toContain(".lunx");
  });
});
