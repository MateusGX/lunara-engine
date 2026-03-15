import type { InputBinding } from "@/types/cartridge";

export class InputManager {
  private held = new Set<number>();
  private justPressed = new Set<number>();
  private keyMap = new Map<string, number>(); // key → button index

  constructor(inputs: InputBinding[]) {
    this.rebuild(inputs);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  rebuild(inputs: InputBinding[]) {
    this.keyMap.clear();
    for (const inp of inputs) {
      this.keyMap.set(inp.key.toLowerCase(), inp.button);
      this.keyMap.set(inp.key, inp.button);
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const btn = this.keyMap.get(e.key) ?? this.keyMap.get(e.key.toLowerCase());
    if (btn === undefined) return;
    if (!this.held.has(btn)) {
      this.justPressed.add(btn);
    }
    this.held.add(btn);
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const btn = this.keyMap.get(e.key) ?? this.keyMap.get(e.key.toLowerCase());
    if (btn === undefined) return;
    this.held.delete(btn);
  };

  tick() {
    this.justPressed.clear();
  }

  btn(i: number): boolean {
    return this.held.has(i);
  }

  btnp(i: number): boolean {
    return this.justPressed.has(i);
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.held.clear();
    this.justPressed.clear();
  }
}
