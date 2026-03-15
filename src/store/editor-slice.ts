import type { StateCreator } from "zustand";
import { EditorTab, type SpriteTool, type MapTool } from "@/types/editor";

export interface EditorSlice {
  activeTab: EditorTab;
  selectedSpriteId: number;
  selectedMapId: number;
  selectedSoundId: number;
  selectedScriptId: number;
  activePaletteIndex: number;
  activeTileSpriteId: number;
  spriteTool: SpriteTool;
  mapTool: MapTool;
  spriteZoom: number;
  mapZoom: number;
  isRunning: boolean;
  previewVisible: boolean;
  consoleOpen: boolean;

  setActiveTab: (tab: EditorTab) => void;
  setSelectedSpriteId: (id: number) => void;
  setSelectedMapId: (id: number) => void;
  setSelectedSoundId: (id: number) => void;
  setSelectedScriptId: (id: number) => void;
  setActivePaletteIndex: (index: number) => void;
  setActiveTileSpriteId: (id: number) => void;
  setSpriteTool: (tool: SpriteTool) => void;
  setMapTool: (tool: MapTool) => void;
  setSpriteZoom: (zoom: number) => void;
  setMapZoom: (zoom: number) => void;
  setIsRunning: (running: boolean) => void;
  setPreviewVisible: (visible: boolean) => void;
  setConsoleOpen: (open: boolean) => void;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  activeTab: EditorTab.Code,
  selectedSpriteId: 0,
  selectedMapId: 0,
  selectedSoundId: 0,
  selectedScriptId: 0,
  activePaletteIndex: 1,
  activeTileSpriteId: 0,
  spriteTool: "pencil",
  mapTool: "paint",
  spriteZoom: 16,
  mapZoom: 2,
  isRunning: false,
  previewVisible: false,
  consoleOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedSpriteId: (id) => set({ selectedSpriteId: id }),
  setSelectedMapId: (id) => set({ selectedMapId: id }),
  setSelectedSoundId: (id) => set({ selectedSoundId: id }),
  setSelectedScriptId: (id) => set({ selectedScriptId: id }),
  setActivePaletteIndex: (index) => set({ activePaletteIndex: index }),
  setActiveTileSpriteId: (id) => set({ activeTileSpriteId: id }),
  setSpriteTool: (tool) => set({ spriteTool: tool }),
  setMapTool: (tool) => set({ mapTool: tool }),
  setSpriteZoom: (zoom) => set({ spriteZoom: zoom }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setIsRunning: (running) => set({ isRunning: running }),
  setPreviewVisible: (visible) => set({ previewVisible: visible }),
  setConsoleOpen: (open) => set({ consoleOpen: open }),
});
