import type { HardwareConfig } from "@/types/cartridge";

export interface CustomPreset {
  id: string;
  name: string;
  desc: string;
  hw: HardwareConfig;
  createdAt: number;
}

const STORAGE_KEY = "lunara-hw-presets";

export function loadCustomPresets(): CustomPreset[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persist(presets: CustomPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function makeDesc(hw: HardwareConfig): string {
  return `${hw.width}×${hw.height} · ${hw.maxFps}fps · ${hw.palette.length} colors`;
}

export function createCustomPreset(name: string, hw: HardwareConfig): CustomPreset {
  const preset: CustomPreset = {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled",
    desc: makeDesc(hw),
    hw,
    createdAt: Date.now(),
  };
  persist([...loadCustomPresets(), preset]);
  return preset;
}

export function updateCustomPreset(id: string, patch: { name?: string; hw?: HardwareConfig }): void {
  persist(
    loadCustomPresets().map((p) =>
      p.id === id
        ? {
            ...p,
            ...(patch.name !== undefined ? { name: patch.name.trim() || p.name } : {}),
            ...(patch.hw !== undefined ? { hw: patch.hw, desc: makeDesc(patch.hw) } : {}),
          }
        : p,
    ),
  );
}

export function deleteCustomPreset(id: string): void {
  persist(loadCustomPresets().filter((p) => p.id !== id));
}
