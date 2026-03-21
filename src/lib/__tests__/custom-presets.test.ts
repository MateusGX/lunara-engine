import { describe, it, expect, beforeEach } from "vitest";
import {
  loadCustomPresets,
  createCustomPreset,
  updateCustomPreset,
  deleteCustomPreset,
} from "../custom-presets";
import type { HardwareConfig } from "@/types/cartridge";

const hw: HardwareConfig = {
  width: 128, height: 128,
  palette: ["#000000", "#ffffff"],
  inputs: [],
  maxSprites: 64, maxSounds: 32,
  maxFps: 30, maxIps: 2_000_000,
  maxMemBytes: 256 * 1024, maxStorageBytes: 128 * 1024,
  spriteSize: 8, sfxSteps: 32,
};

beforeEach(() => {
  localStorage.clear();
});

// ── loadCustomPresets ─────────────────────────────────────────────────────────

describe("loadCustomPresets", () => {
  it("returns empty array when storage is empty", () => {
    expect(loadCustomPresets()).toEqual([]);
  });

  it("returns empty array when storage contains invalid JSON", () => {
    localStorage.setItem("lunara-hw-presets", "{broken");
    expect(loadCustomPresets()).toEqual([]);
  });

  it("returns persisted presets", () => {
    createCustomPreset("A", hw);
    createCustomPreset("B", hw);
    expect(loadCustomPresets()).toHaveLength(2);
  });
});

// ── createCustomPreset ────────────────────────────────────────────────────────

describe("createCustomPreset", () => {
  it("returns a preset with the given name and hw", () => {
    const p = createCustomPreset("My Preset", hw);
    expect(p.name).toBe("My Preset");
    expect(p.hw).toEqual(hw);
  });

  it("persists the preset to localStorage", () => {
    createCustomPreset("Saved", hw);
    expect(loadCustomPresets()).toHaveLength(1);
  });

  it("generates a unique id for each preset", () => {
    const a = createCustomPreset("A", hw);
    const b = createCustomPreset("B", hw);
    expect(a.id).not.toBe(b.id);
  });

  it("trims whitespace from the name", () => {
    const p = createCustomPreset("  Trimmed  ", hw);
    expect(p.name).toBe("Trimmed");
  });

  it("falls back to 'Untitled' when name is blank", () => {
    const p = createCustomPreset("   ", hw);
    expect(p.name).toBe("Untitled");
  });

  it("builds the desc from hw dimensions, fps and palette size", () => {
    const p = createCustomPreset("X", hw);
    expect(p.desc).toBe("128×128 · 30fps · 2 colors");
  });

  it("sets createdAt to a recent timestamp", () => {
    const before = Date.now();
    const p = createCustomPreset("T", hw);
    expect(p.createdAt).toBeGreaterThanOrEqual(before);
    expect(p.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it("appends to existing presets without overwriting them", () => {
    createCustomPreset("First", hw);
    createCustomPreset("Second", hw);
    const all = loadCustomPresets();
    expect(all.map((p) => p.name)).toEqual(["First", "Second"]);
  });
});

// ── updateCustomPreset ────────────────────────────────────────────────────────

describe("updateCustomPreset", () => {
  it("renames a preset", () => {
    const p = createCustomPreset("Old", hw);
    updateCustomPreset(p.id, { name: "New" });
    expect(loadCustomPresets()[0].name).toBe("New");
  });

  it("trims whitespace when renaming", () => {
    const p = createCustomPreset("Old", hw);
    updateCustomPreset(p.id, { name: "  Trimmed  " });
    expect(loadCustomPresets()[0].name).toBe("Trimmed");
  });

  it("keeps the original name when the new name is blank", () => {
    const p = createCustomPreset("Keep", hw);
    updateCustomPreset(p.id, { name: "   " });
    expect(loadCustomPresets()[0].name).toBe("Keep");
  });

  it("updates hw and regenerates desc", () => {
    const p = createCustomPreset("P", hw);
    const newHw: HardwareConfig = { ...hw, width: 256, height: 240, maxFps: 60 };
    updateCustomPreset(p.id, { hw: newHw });
    const updated = loadCustomPresets()[0];
    expect(updated.hw).toEqual(newHw);
    expect(updated.desc).toBe("256×240 · 60fps · 2 colors");
  });

  it("does not affect other presets", () => {
    const a = createCustomPreset("A", hw);
    const b = createCustomPreset("B", hw);
    updateCustomPreset(a.id, { name: "A2" });
    const all = loadCustomPresets();
    expect(all.find((p) => p.id === b.id)?.name).toBe("B");
  });

  it("is a no-op for an unknown id", () => {
    createCustomPreset("A", hw);
    updateCustomPreset("nonexistent", { name: "X" });
    expect(loadCustomPresets()[0].name).toBe("A");
  });
});

// ── deleteCustomPreset ────────────────────────────────────────────────────────

describe("deleteCustomPreset", () => {
  it("removes the preset with the given id", () => {
    const p = createCustomPreset("Delete me", hw);
    deleteCustomPreset(p.id);
    expect(loadCustomPresets()).toHaveLength(0);
  });

  it("does not remove other presets", () => {
    const a = createCustomPreset("A", hw);
    const b = createCustomPreset("B", hw);
    deleteCustomPreset(a.id);
    const remaining = loadCustomPresets();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(b.id);
  });

  it("is a no-op for an unknown id", () => {
    createCustomPreset("A", hw);
    deleteCustomPreset("nonexistent");
    expect(loadCustomPresets()).toHaveLength(1);
  });
});
