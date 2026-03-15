import type { StateCreator } from "zustand";
import type { Cartridge } from "@/types/cartridge";
import * as repo from "@/db/cartridge-repository";

export interface CartridgeSlice {
  projects: Cartridge[];
  activeCartridge: Cartridge | null;

  loadProjects: () => Promise<void>;
  setActiveCartridge: (cartridge: Cartridge) => void;
  updateActiveCartridge: (partial: Partial<Cartridge>) => void;
  saveActiveCartridge: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createProject: (cartridge: Cartridge) => Promise<void>;
}

export const createCartridgeSlice: StateCreator<CartridgeSlice> = (set, get) => ({
  projects: [],
  activeCartridge: null,

  loadProjects: async () => {
    const projects = await repo.getAll();
    projects.sort((a: Cartridge, b: Cartridge) => b.meta.updated - a.meta.updated);
    set({ projects });
  },

  setActiveCartridge: (cartridge) => {
    set({ activeCartridge: cartridge });
  },

  updateActiveCartridge: (partial) => {
    const current = get().activeCartridge;
    if (!current) return;
    const updated: Cartridge = {
      ...current,
      ...partial,
      meta: {
        ...current.meta,
        ...(partial.meta ?? {}),
        updated: Date.now(),
      },
    };
    set({ activeCartridge: updated });
  },

  saveActiveCartridge: async () => {
    const { activeCartridge } = get();
    if (!activeCartridge) return;
    await repo.save(activeCartridge);
    set((state) => ({
      projects: state.projects.some((p) => p.meta.id === activeCartridge.meta.id)
        ? state.projects.map((p) =>
            p.meta.id === activeCartridge.meta.id ? activeCartridge : p
          )
        : [activeCartridge, ...state.projects],
    }));
  },

  deleteProject: async (id) => {
    await repo.remove(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.meta.id !== id),
      activeCartridge:
        state.activeCartridge?.meta.id === id ? null : state.activeCartridge,
    }));
  },

  createProject: async (cartridge) => {
    await repo.save(cartridge);
    set((state) => ({ projects: [cartridge, ...state.projects] }));
  },
});
