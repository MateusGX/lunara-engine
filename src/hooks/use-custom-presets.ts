import { useState, useCallback } from "react";
import {
  loadCustomPresets,
  createCustomPreset,
  updateCustomPreset,
  deleteCustomPreset,
} from "@/lib/custom-presets";
import type { CustomPreset } from "@/lib/custom-presets";
import type { HardwareConfig } from "@/types/cartridge";

export function useCustomPresets() {
  const [presets, setPresets] = useState<CustomPreset[]>(() => loadCustomPresets());

  const add = useCallback((name: string, hw: HardwareConfig): CustomPreset => {
    const preset = createCustomPreset(name, hw);
    setPresets((prev) => [...prev, preset]);
    return preset;
  }, []);

  const rename = useCallback((id: string, name: string): void => {
    updateCustomPreset(id, { name });
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)));
  }, []);

  const remove = useCallback((id: string): void => {
    deleteCustomPreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { presets, add, rename, remove };
}
