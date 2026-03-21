import { describe, it, expect, beforeEach, vi } from "vitest";
import { getAll, get, save, remove } from "../cartridge-repository";
import { getDb } from "../index";
import type { Cartridge } from "@/types/cartridge";

// ── Mock the IndexedDB layer ──────────────────────────────────────────────────

vi.mock("../index");

const fakeDb = {
  getAll: vi.fn(),
  get:    vi.fn(),
  put:    vi.fn(),
  delete: vi.fn(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCartridge(id = "abc-123"): Cartridge {
  return {
    meta: { id, name: "Test", author: "", description: "", version: "1.0.0", created: 0, updated: 0 },
    hardware: {
      width: 128, height: 128,
      palette: ["#000000", "#ffffff"],
      inputs: [],
      maxSprites: 64, maxSounds: 32,
      maxFps: 30, maxIps: 2_000_000,
      maxMemBytes: 256 * 1024, maxStorageBytes: 128 * 1024,
      spriteSize: 8, sfxSteps: 32,
    },
    scripts: [], sprites: [], maps: [], sounds: [],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("cartridge-repository", () => {
  beforeEach(() => {
    fakeDb.getAll.mockResolvedValue([]);
    fakeDb.get.mockResolvedValue(undefined);
    fakeDb.put.mockResolvedValue(undefined);
    fakeDb.delete.mockResolvedValue(undefined);
    vi.mocked(getDb).mockResolvedValue(fakeDb as never);
  });

  describe("getAll()", () => {
    it("returns an empty array when the store is empty", async () => {
      const result = await getAll();
      expect(result).toEqual([]);
    });

    it("returns all cartridges from the store", async () => {
      fakeDb.getAll.mockResolvedValue([makeCartridge("id-1"), makeCartridge("id-2")]);
      const result = await getAll();
      expect(result).toHaveLength(2);
      expect(result[0].meta.id).toBe("id-1");
    });
  });

  describe("get()", () => {
    it("returns undefined when the cartridge does not exist", async () => {
      const result = await get("missing-id");
      expect(result).toBeUndefined();
    });

    it("returns the matching cartridge", async () => {
      fakeDb.get.mockResolvedValue(makeCartridge("xyz"));
      const result = await get("xyz");
      expect(result?.meta.id).toBe("xyz");
    });

    it("calls db.get with the correct store name and id", async () => {
      await get("some-id");
      expect(fakeDb.get).toHaveBeenCalledWith("cartridges", "some-id");
    });
  });

  describe("save()", () => {
    it("calls db.put with the cartridge", async () => {
      const cart = makeCartridge("save-id");
      await save(cart);
      expect(fakeDb.put).toHaveBeenCalledWith("cartridges", cart);
    });

    it("resolves without throwing", async () => {
      await expect(save(makeCartridge())).resolves.toBeUndefined();
    });
  });

  describe("remove()", () => {
    it("calls db.delete with the correct store name and id", async () => {
      await remove("del-id");
      expect(fakeDb.delete).toHaveBeenCalledWith("cartridges", "del-id");
    });

    it("resolves without throwing", async () => {
      await expect(remove("any-id")).resolves.toBeUndefined();
    });
  });
});
