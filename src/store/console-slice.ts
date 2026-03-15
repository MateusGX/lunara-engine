import type { StateCreator } from "zustand";
import type { ConsoleMessage } from "@/types/editor";

const MAX_MESSAGES = 500;
let _msgId = 0;

export interface ConsoleSlice {
  messages: ConsoleMessage[];
  addMessage: (type: ConsoleMessage["type"], text: string) => void;
  clearMessages: () => void;
}

export const createConsoleSlice: StateCreator<ConsoleSlice> = (set) => ({
  messages: [],

  addMessage: (type, text) => {
    const message: ConsoleMessage = {
      id: _msgId++,
      type,
      text,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages:
        state.messages.length >= MAX_MESSAGES
          ? [...state.messages.slice(1), message]
          : [...state.messages, message],
    }));
  },

  clearMessages: () => set({ messages: [] }),
});
