import { describe, it, expect, vi, beforeEach } from "vitest";
import { importLun, exportLun, exportFlat, calcStorageBytes } from "../export";
import type { Cartridge } from "@/types/cartridge";

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
      width: 128, height: 128,
      palette: ["#000000", "#ffffff"],
      inputs: [],
      maxSprites: 256, maxSounds: 64, maxFps: 60,
      maxIps: 8_000_000, maxMemBytes: 2 * 1024 * 1024,
      maxStorageBytes: 512 * 1024, spriteSize: 8, sfxSteps: 32,
    },
    scripts: [{ id: 0, name: "main", code: "-- test" }],
    sprites: [], maps: [], sounds: [],
    ...overrides,
  };
}

// ─── Canvas mock ──────────────────────────────────────────────────────────────

function makeCtxMock(pixels: Uint8ClampedArray, w: number, h: number) {
  return {
    fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    arcTo: vi.fn(), arc: vi.fn(), closePath: vi.fn(), fill: vi.fn(),
    stroke: vi.fn(), clip: vi.fn(), save: vi.fn(), restore: vi.fn(),
    drawImage: vi.fn(), fillText: vi.fn(),
    roundRect: vi.fn(), strokeRect: vi.fn(), rect: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    getImageData: vi.fn(() => ({ data: pixels, width: w, height: h })),
    putImageData: vi.fn((d: { data: Uint8ClampedArray }) => pixels.set(d.data)),
    lineWidth: 0, strokeStyle: "", fillStyle: "",
    font: "", textAlign: "", textBaseline: "", letterSpacing: "",
  };
}

function setupMocks(w = 400, h = 600) {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

  const pixels = new Uint8ClampedArray(w * h * 4).fill(128);
  const ctx = makeCtxMock(pixels, w, h);
  const mockAnchor = { href: "", download: "", click: vi.fn() };
  const canvas = {
    width: w, height: h,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(new Blob(["png"]))),
  };

  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") return canvas as unknown as HTMLElement;
    if (tag === "a") return mockAnchor as unknown as HTMLElement;
    return document.createElement(tag);
  });
  vi.spyOn(document.body, "appendChild").mockImplementation((el) => el);
  vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

  return { mockAnchor, pixels, ctx };
}

// ─── importLun ────────────────────────────────────────────────────────────────

describe("importLun", () => {
  it("parses a valid .lun file", async () => {
    const c = makeCartridge();
    const file = new File([JSON.stringify(c)], "test.lun");
    const result = await importLun(file);
    expect(result.meta.id).toBe("test-id-123");
    expect(result.scripts).toHaveLength(1);
  });

  it("assigns a UUID when meta.id is missing", async () => {
    const c = makeCartridge();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (c.meta as any).id;
    const result = await importLun(new File([JSON.stringify(c)], "t.lun"));
    expect(result.meta.id).toBeTruthy();
  });

  it("handles legacy single-code format", async () => {
    const old = { meta: { id: "x", name: "Old", author: "" }, hardware: makeCartridge().hardware, code: "-- hi", sprites: [], maps: [], sounds: [] };
    const result = await importLun(new File([JSON.stringify(old)], "t.lun"));
    expect(result.scripts[0].code).toBe("-- hi");
  });

  it("rejects invalid JSON", async () => {
    await expect(importLun(new File(["not json"], "t.lun"))).rejects.toThrow("Invalid .lun file");
  });
});

// ─── exportLun ────────────────────────────────────────────────────────────────

describe("exportLun", () => {
  beforeEach(() => setupMocks());

  it("triggers a download without throwing", () => {
    expect(() => exportLun(makeCartridge())).not.toThrow();
  });

  it("uses .lun extension with cartridge name", () => {
    const { mockAnchor } = setupMocks();
    exportLun(makeCartridge({ meta: { ...makeCartridge().meta, name: "My Game" } }));
    expect(mockAnchor.download).toBe("My_Game_v1.0.0.lun");
  });
});

// ─── exportFlat ───────────────────────────────────────────────────────────────

describe("exportFlat", () => {
  beforeEach(() => setupMocks());

  it("resolves without throwing", async () => {
    await expect(exportFlat(makeCartridge())).resolves.not.toThrow();
  });

  it("uses .png extension", async () => {
    const { mockAnchor } = setupMocks();
    await exportFlat(makeCartridge());
    expect(mockAnchor.download).toMatch(/\.png$/);
  });

  it("includes cartridge name in filename", async () => {
    const { mockAnchor } = setupMocks();
    await exportFlat(makeCartridge({ meta: { ...makeCartridge().meta, name: "Space Run" } }));
    expect(mockAnchor.download).toContain("Space_Run");
  });
});

// ─── calcStorageBytes ─────────────────────────────────────────────────────────

describe("calcStorageBytes", () => {
  it("returns 0 with no assets", () => {
    expect(calcStorageBytes(makeCartridge({ sprites: [], maps: [], scripts: [], sounds: [] }))).toBe(0);
  });

  it("counts sprite pixels at 1 byte each", () => {
    const c = makeCartridge({ sprites: [{ id: 0, width: 8, height: 8, pixels: new Array(64).fill(1) }], maps: [], scripts: [], sounds: [] });
    expect(calcStorageBytes(c)).toBe(64);
  });

  it("counts map tile entries at 9 bytes each", () => {
    const c = makeCartridge({ sprites: [], maps: [{ id: 0, name: "M", tiles: { "0,0": 0, "1,0": 0, "2,0": 0 } }], scripts: [], sounds: [] });
    expect(calcStorageBytes(c)).toBe(27);
  });

  it("counts script chars at 1 byte each", () => {
    const c = makeCartridge({ sprites: [], maps: [], scripts: [{ id: 0, name: "m", code: "hello" }], sounds: [] });
    expect(calcStorageBytes(c)).toBe(5);
  });

  it("counts sound notes at 4 bytes each", () => {
    const c = makeCartridge({ sprites: [], maps: [], scripts: [], sounds: [{ id: 0, name: "s", notes: new Array(8).fill({ note: null, volume: 1 }), steps: 8, tempo: 120, waveform: "square" }] });
    expect(calcStorageBytes(c)).toBe(32);
  });

  it("sums all asset types", () => {
    const c = makeCartridge({
      sprites: [{ id: 0, width: 4, height: 4, pixels: new Array(16).fill(0) }],
      maps: [{ id: 0, name: "M", tiles: { "0,0": 0 } }],
      scripts: [{ id: 0, name: "m", code: "abc" }],
      sounds: [{ id: 0, name: "s", notes: new Array(4).fill({ note: null, volume: 1 }), steps: 4, tempo: 120, waveform: "square" }],
    });
    expect(calcStorageBytes(c)).toBe(16 + 9 + 3 + 16);
  });
});
