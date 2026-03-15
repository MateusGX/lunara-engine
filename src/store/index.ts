import { create } from "zustand";
import { createCartridgeSlice, type CartridgeSlice } from "./cartridge-slice";
import { createEditorSlice, type EditorSlice } from "./editor-slice";
import { createConsoleSlice, type ConsoleSlice } from "./console-slice";

export type AppStore = CartridgeSlice & EditorSlice & ConsoleSlice;

export const useStore = create<AppStore>()((...args) => ({
  ...createCartridgeSlice(...args),
  ...createEditorSlice(...args),
  ...createConsoleSlice(...args),
}));
