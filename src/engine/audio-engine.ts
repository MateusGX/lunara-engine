import type { SoundData } from "@/types/cartridge";

// MIDI note to frequency
function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sounds: SoundData[];
  private musicSource: ReturnType<typeof setTimeout> | null = null;

  constructor(sounds: SoundData[]) {
    this.sounds = sounds;
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  updateSounds(sounds: SoundData[]) {
    this.sounds = sounds;
  }

  sfx(n: number) {
    const sound = this.sounds[n];
    if (!sound) return;
    const ctx = this.getCtx();
    const stepDuration = 60 / sound.tempo / 4; // quarter note subdivision
    let t = ctx.currentTime + 0.01;

    for (const noteData of sound.notes) {
      const hold = (noteData.duration ?? 1) * stepDuration;
      if (noteData.note !== null) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = noteData.waveform ?? sound.waveform;
        osc.frequency.setValueAtTime(midiToFreq(noteData.note), t);
        gain.gain.setValueAtTime((noteData.volume ?? 1) * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + hold * 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + hold);
      }
      t += stepDuration;
    }
  }

  music(n: number) {
    if (this.musicSource !== null) {
      clearTimeout(this.musicSource);
      this.musicSource = null;
    }

    const sound = this.sounds[n];
    if (!sound) return;

    const totalDuration =
      (60 / sound.tempo / 4) * sound.notes.length * 1000;

    const loop = () => {
      this.sfx(n);
      this.musicSource = setTimeout(loop, totalDuration);
    };
    loop();
  }

  stopMusic() {
    if (this.musicSource !== null) {
      clearTimeout(this.musicSource);
      this.musicSource = null;
    }
  }

  dispose() {
    this.stopMusic();
    this.ctx?.close();
    this.ctx = null;
  }
}
