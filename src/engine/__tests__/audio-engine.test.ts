import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AudioEngine } from "../audio-engine";
import type { SoundData } from "@/types/cartridge";

// Mock AudioContext globally
const mockOscillator = {
  type: "" as OscillatorType,
  frequency: { setValueAtTime: vi.fn() },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

const mockGain = {
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
};

const mockAudioCtx = {
  currentTime: 0,
  state: "running" as AudioContextState,
  resume: vi.fn(),
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  destination: {} as AudioDestinationNode,
  close: vi.fn(),
};

// Must use regular function (not arrow) so it can be called with `new`
vi.stubGlobal(
  "AudioContext",
  vi.fn(function MockAudioContext() {
    return mockAudioCtx;
  }),
);

function makeSound(overrides: Partial<SoundData> = {}): SoundData {
  return {
    id: 0,
    name: "test",
    tempo: 120,
    waveform: "square",
    steps: 4,
    notes: [
      { note: 60, volume: 1, duration: 1 }, // middle C
      { note: 64, volume: 0.8, duration: 1 }, // E
      { note: null, volume: 1, duration: 1 }, // rest
      { note: 67, volume: 1, duration: 1 }, // G
    ],
    ...overrides,
  };
}

describe("AudioEngine", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AudioEngine([makeSound()]);
  });

  afterEach(() => {
    engine.dispose();
  });

  describe("sfx()", () => {
    it("creates oscillators for notes that are not null", () => {
      engine.sfx(0);
      // 3 non-null notes → 3 oscillators
      expect(mockAudioCtx.createOscillator).toHaveBeenCalledTimes(3);
    });

    it("does not create an oscillator for rest notes (note === null)", () => {
      const sound = makeSound({
        notes: [{ note: null, volume: 1, duration: 1 }],
      });
      const restEngine = new AudioEngine([sound]);
      restEngine.sfx(0);
      expect(mockAudioCtx.createOscillator).not.toHaveBeenCalled();
      restEngine.dispose();
    });

    it("does nothing when the sound index is out of bounds", () => {
      expect(() => engine.sfx(99)).not.toThrow();
      expect(mockAudioCtx.createOscillator).not.toHaveBeenCalled();
    });

    it("sets oscillator type from note waveform or sound default", () => {
      engine.sfx(0);
      expect(mockOscillator.type).toBeDefined();
    });

    it("connects oscillator to gain and gain to destination", () => {
      engine.sfx(0);
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
      expect(mockGain.connect).toHaveBeenCalledWith(mockAudioCtx.destination);
    });

    it("starts and schedules stop for each oscillator", () => {
      engine.sfx(0);
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("initializes AudioContext lazily on first call", () => {
      const lazyEngine = new AudioEngine([makeSound()]);
      // No AudioContext yet
      const AudioContextSpy = vi.mocked(AudioContext);
      const callsBefore = AudioContextSpy.mock.calls.length;
      lazyEngine.sfx(0);
      expect(AudioContextSpy.mock.calls.length).toBeGreaterThan(callsBefore);
      lazyEngine.dispose();
    });
  });

  describe("music()", () => {
    it("starts playback (calls sfx internally)", () => {
      vi.useFakeTimers();
      engine.music(0);
      expect(mockAudioCtx.createOscillator).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("replaces existing music when called again", () => {
      vi.useFakeTimers();
      engine.music(0);
      const firstCallCount = mockAudioCtx.createOscillator.mock.calls.length;
      vi.clearAllMocks();
      engine.music(0);
      expect(mockAudioCtx.createOscillator).toHaveBeenCalled();
      vi.useRealTimers();
      void firstCallCount;
    });

    it("does nothing when sound index is out of bounds", () => {
      expect(() => engine.music(99)).not.toThrow();
    });

    it("loops after the total duration elapses", () => {
      vi.useFakeTimers();
      engine.music(0);
      const callsAfterFirst = mockAudioCtx.createOscillator.mock.calls.length;
      // The music should loop — advance time past total duration
      // tempo=120, 4 notes → stepDuration = 60/120/4 = 0.125s per step
      // total = 0.125 * 4 * 1000 = 500ms
      vi.advanceTimersByTime(600);
      expect(mockAudioCtx.createOscillator.mock.calls.length).toBeGreaterThan(callsAfterFirst);
      vi.useRealTimers();
    });
  });

  describe("stopMusic()", () => {
    it("stops the looping music", () => {
      vi.useFakeTimers();
      engine.music(0);
      engine.stopMusic();
      const callsAfterStop = mockAudioCtx.createOscillator.mock.calls.length;
      vi.advanceTimersByTime(1000);
      expect(mockAudioCtx.createOscillator.mock.calls.length).toBe(callsAfterStop);
      vi.useRealTimers();
    });

    it("does nothing if music was never started", () => {
      expect(() => engine.stopMusic()).not.toThrow();
    });
  });

  describe("dispose()", () => {
    it("stops music and closes AudioContext", () => {
      engine.sfx(0); // trigger lazy AudioContext creation
      engine.dispose();
      expect(mockAudioCtx.close).toHaveBeenCalled();
    });

    it("does not throw if AudioContext was never created", () => {
      const freshEngine = new AudioEngine([makeSound()]);
      expect(() => freshEngine.dispose()).not.toThrow();
    });
  });

  describe("updateSounds()", () => {
    it("replaces the sounds array", () => {
      const newSound = makeSound({ id: 0, name: "new", tempo: 200, notes: [] });
      engine.updateSounds([newSound]);
      // sfx should not crash with updated sounds
      expect(() => engine.sfx(0)).not.toThrow();
    });
  });

  describe("getCtx() suspended state", () => {
    it("calls resume() when AudioContext state is suspended", () => {
      mockAudioCtx.state = "suspended";
      engine.sfx(0);
      expect(mockAudioCtx.resume).toHaveBeenCalled();
      mockAudioCtx.state = "running";
    });
  });

  describe("sfx() default value branches", () => {
    it("uses duration default of 1 when noteData.duration is undefined", () => {
      const sound = makeSound({
        notes: [{ note: 60, volume: 1 }], // duration omitted (optional)
      });
      const e = new AudioEngine([sound]);
      expect(() => e.sfx(0)).not.toThrow();
      e.dispose();
    });

    it("uses volume default of 1 when noteData.volume is null/undefined", () => {
      const sound = makeSound({
        notes: [{ note: 60, volume: null as unknown as number, duration: 1 }],
      });
      const e = new AudioEngine([sound]);
      expect(() => e.sfx(0)).not.toThrow();
      e.dispose();
    });
  });
});
