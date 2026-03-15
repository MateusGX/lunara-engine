export const EditorTab = {
  Code: "code",
  Sprite: "sprite",
  Map: "map",
  Sound: "sound",
  Settings: "settings",
  Console: "console",
} as const;

export type EditorTab = (typeof EditorTab)[keyof typeof EditorTab];

export type SpriteTool = "pencil" | "fill" | "eraser" | "eyedropper" | "line";

export type MapTool = "paint" | "erase" | "pan";

export interface ConsoleMessage {
  id: number;
  type: "log" | "error" | "warn" | "info";
  text: string;
  timestamp: number;
}
