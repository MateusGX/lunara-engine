import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InputManager } from "../input-manager";
import type { InputBinding } from "@/types/cartridge";

const DEFAULT_INPUTS: InputBinding[] = [
  { button: 0, key: "ArrowLeft", label: "Left" },
  { button: 1, key: "ArrowRight", label: "Right" },
  { button: 2, key: "ArrowUp", label: "Up" },
  { button: 3, key: "ArrowDown", label: "Down" },
  { button: 4, key: "z", label: "A" },
  { button: 5, key: "x", label: "B" },
];

function fireKeyDown(key: string) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true }));
}

function fireKeyUp(key: string) {
  window.dispatchEvent(new KeyboardEvent("keyup", { key }));
}

describe("InputManager", () => {
  let manager: InputManager;

  beforeEach(() => {
    manager = new InputManager(DEFAULT_INPUTS);
  });

  afterEach(() => {
    manager.dispose();
  });

  describe("btn()", () => {
    it("returns false when no key is pressed", () => {
      expect(manager.btn(0)).toBe(false);
    });

    it("returns true while a mapped key is held down", () => {
      fireKeyDown("ArrowLeft");
      expect(manager.btn(0)).toBe(true);
    });

    it("returns false after the key is released", () => {
      fireKeyDown("ArrowLeft");
      fireKeyUp("ArrowLeft");
      expect(manager.btn(0)).toBe(false);
    });

    it("tracks multiple buttons held simultaneously", () => {
      fireKeyDown("ArrowLeft");
      fireKeyDown("ArrowRight");
      expect(manager.btn(0)).toBe(true);
      expect(manager.btn(1)).toBe(true);
    });

    it("ignores unmapped keys", () => {
      fireKeyDown("Enter");
      expect(manager.btn(0)).toBe(false);
      expect(manager.btn(4)).toBe(false);
    });
  });

  describe("btnp()", () => {
    it("returns false when no key is pressed", () => {
      expect(manager.btnp(0)).toBe(false);
    });

    it("returns true on the frame the key is first pressed", () => {
      fireKeyDown("ArrowLeft");
      expect(manager.btnp(0)).toBe(true);
    });

    it("returns false after tick() clears just-pressed state", () => {
      fireKeyDown("ArrowLeft");
      manager.tick();
      expect(manager.btnp(0)).toBe(false);
    });

    it("does NOT set btnp again while key stays held (auto-repeat guard)", () => {
      fireKeyDown("z");
      manager.tick();
      // Simulate a second keydown event while held (browser repeat)
      fireKeyDown("z");
      expect(manager.btnp(4)).toBe(false);
    });

    it("sets btnp true again after key is released and re-pressed", () => {
      fireKeyDown("z");
      manager.tick();
      fireKeyUp("z");
      fireKeyDown("z");
      expect(manager.btnp(4)).toBe(true);
    });
  });

  describe("tick()", () => {
    it("clears justPressed but keeps held state", () => {
      fireKeyDown("ArrowUp");
      manager.tick();
      expect(manager.btnp(2)).toBe(false);
      expect(manager.btn(2)).toBe(true);
    });
  });

  describe("rebuild()", () => {
    it("rebinds keys to new buttons", () => {
      const newInputs: InputBinding[] = [
        { button: 0, key: "a", label: "Left" },
        { button: 1, key: "d", label: "Right" },
      ];
      manager.rebuild(newInputs);
      fireKeyDown("a");
      expect(manager.btn(0)).toBe(true);
      fireKeyUp("a");
    });

    it("old keys no longer trigger buttons after rebuild", () => {
      const newInputs: InputBinding[] = [{ button: 0, key: "a", label: "Left" }];
      manager.rebuild(newInputs);
      fireKeyDown("ArrowLeft"); // was button 0 before rebuild
      expect(manager.btn(0)).toBe(false);
      fireKeyUp("ArrowLeft");
    });
  });

  describe("dispose()", () => {
    it("stops listening to keyboard events after dispose", () => {
      manager.dispose();
      fireKeyDown("ArrowLeft");
      // Should not track after dispose
      expect(manager.btn(0)).toBe(false);
    });

    it("clears all button state on dispose", () => {
      fireKeyDown("ArrowLeft");
      expect(manager.btn(0)).toBe(true);
      manager.dispose();
      expect(manager.btn(0)).toBe(false);
    });
  });
});
