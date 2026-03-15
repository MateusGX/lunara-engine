import {
  createDefaultCartridge,
  createBlankCartridge,
  createPlatformerTemplate,
} from "@/lib/cartridge-template";
import type { Cartridge } from "@/types/cartridge";

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  create: (name: string, author: string) => Cartridge;
}

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Empty project with the default 16-color palette and 128×128 screen.",
    icon: "File",
    create: createBlankCartridge,
  },
  {
    id: "hello",
    name: "Hello World",
    description: "Simple example — a circle that moves with the arrow keys.",
    icon: "Smiley",
    create: createDefaultCartridge,
  },
  {
    id: "platformer",
    name: "Platformer",
    description: "Starter template with gravity, movement, and jumping.",
    icon: "GameController",
    create: createPlatformerTemplate,
  },
];
