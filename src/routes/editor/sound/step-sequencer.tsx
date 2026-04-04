import { useState } from "react";
import { useStore } from "@/store";
import { AudioEngine } from "@/engine/audio-engine";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlayIcon, XIcon } from "@phosphor-icons/react";
import type { SoundData, SoundNote } from "@/types/cartridge";

// ── Note preview ───────────────────────────────────────────────────────────

let _previewCtx: AudioContext | null = null;
function getPreviewCtx(): AudioContext {
  if (!_previewCtx || _previewCtx.state === "closed")
    _previewCtx = new AudioContext();
  if (_previewCtx.state === "suspended") _previewCtx.resume();
  return _previewCtx;
}
function previewNote(
  midi: number,
  waveform: SoundData["waveform"],
  volume: number,
  durationSecs: number,
) {
  const ctx = getPreviewCtx();
  const t = ctx.currentTime + 0.01;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = waveform;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume * 0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSecs * 0.9);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + durationSecs);
}

// ── Constants ──────────────────────────────────────────────────────────────

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_PX: Record<number, number> = {
  1: 11,
  3: 29,
  6: 65,
  8: 83,
  10: 101,
};
const WHITE_W = 18;
const OCTAVES = [3, 4, 5];
const DEFAULT_NOTE = 60;

const WAVEFORMS: {
  id: SoundData["waveform"];
  symbol: string;
  label: string;
}[] = [
  { id: "sine", symbol: "∿", label: "Sine" },
  { id: "square", symbol: "⊓", label: "Square" },
  { id: "sawtooth", symbol: "⊿", label: "Sawtooth" },
  { id: "triangle", symbol: "⋀", label: "Triangle" },
];

const WAVE_STYLE: Record<
  string,
  { bg: string; dim: string; text: string; btn: string }
> = {
  sine: {
    bg: "bg-sky-400",
    dim: "bg-sky-400/20",
    text: "text-sky-300",
    btn: "border-sky-400/50 bg-sky-400/12 text-sky-300",
  },
  square: {
    bg: "bg-rpg-gold",
    dim: "bg-rpg-gold/15",
    text: "text-rpg-gold",
    btn: "border-rpg-gold/50 bg-rpg-gold/12 text-rpg-gold",
  },
  sawtooth: {
    bg: "bg-orange-400",
    dim: "bg-orange-400/20",
    text: "text-orange-300",
    btn: "border-orange-400/50 bg-orange-400/12 text-orange-300",
  },
  triangle: {
    bg: "bg-rpg-emerald",
    dim: "bg-rpg-emerald/20",
    text: "text-rpg-emerald",
    btn: "border-rpg-emerald/50 bg-rpg-emerald/12 text-rpg-emerald",
  },
};

const DURATIONS = [
  { value: 1, label: "1/16" },
  { value: 2, label: "1/8" },
  { value: 4, label: "1/4" },
  { value: 8, label: "1/2" },
];

function noteName(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}
function resolveWave(
  note: SoundNote,
  fallback: SoundData["waveform"],
): SoundData["waveform"] {
  return note.waveform ?? fallback;
}

// ── Piano keyboard ─────────────────────────────────────────────────────────

function PianoKeyboard({
  value,
  onChange,
  onPreview,
  accentWave,
}: {
  value: number;
  onChange: (n: number) => void;
  onPreview: (n: number) => void;
  accentWave: SoundData["waveform"];
}) {
  const accent = WAVE_STYLE[accentWave];
  const totalW = OCTAVES.length * 7 * WHITE_W;
  return (
    <div className="overflow-x-auto border border-rpg-gold/12 bg-surface-base">
      <div className="relative" style={{ width: totalW, height: 48 }}>
        {OCTAVES.map((oct, octIdx) => {
          const octX = octIdx * 7 * WHITE_W;
          return (
            <span key={oct}>
              {WHITE_OFFSETS.map((semitone, wIdx) => {
                const midi = oct * 12 + 12 + semitone;
                const sel = value === midi;
                return (
                  <button
                    key={midi}
                    onClick={() => {
                      onChange(midi);
                      onPreview(midi);
                    }}
                    className={`absolute bottom-0 border border-rpg-gold/20 transition ${
                      sel
                        ? `${accent.bg} border-transparent`
                        : "bg-[#e8e0d0] hover:bg-white"
                    }`}
                    style={{
                      left: octX + wIdx * WHITE_W,
                      width: WHITE_W - 1,
                      height: 48,
                    }}
                    title={noteName(midi)}
                  />
                );
              })}
              {Object.entries(BLACK_PX).map(([semStr, bx]) => {
                const midi = oct * 12 + 12 + Number(semStr);
                const sel = value === midi;
                return (
                  <button
                    key={midi}
                    onClick={() => {
                      onChange(midi);
                      onPreview(midi);
                    }}
                    className={`absolute z-10 transition ${
                      sel ? `${accent.bg}` : "bg-surface-base hover:bg-surface-raised"
                    }`}
                    style={{ left: octX + bx, width: 12, height: 30, top: 0 }}
                    title={noteName(midi)}
                  />
                );
              })}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Step cell ──────────────────────────────────────────────────────────────

function StepCell({
  index,
  note,
  selected,
  defaultWave,
  onClick,
}: {
  index: number;
  note: SoundNote;
  selected: boolean;
  defaultWave: SoundData["waveform"];
  onClick: () => void;
}) {
  const active = note.note !== null;
  const wave = resolveWave(note, defaultWave);
  const style = WAVE_STYLE[wave];
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-12 w-full flex-col items-center justify-center gap-0.5 overflow-hidden border transition-all duration-100 ${
        selected
          ? active
            ? `${style.bg} border-transparent shadow-md`
            : "border-rpg-gold/40 bg-rpg-gold/10"
          : active
            ? `${style.dim} border-transparent hover:brightness-125`
            : "border-rpg-gold/8 bg-rpg-gold/2 hover:border-rpg-gold/20 hover:bg-rpg-gold/5"
      }`}
    >
      {active && (
        <span
          className={`absolute inset-x-0 top-0 h-0.5 ${selected ? "bg-white/50" : style.bg}`}
        />
      )}
      {active ? (
        <>
          <span
            className={`text-[11px] font-bold leading-none ${selected ? "text-white" : style.text}`}
          >
            {noteName(note.note!)}
          </span>
          <span
            className={`text-xs leading-none ${selected ? "text-white/60" : "opacity-40"}`}
          >
            {WAVEFORMS.find((w) => w.id === wave)?.symbol ?? ""}
          </span>
          {(note.duration ?? 1) > 1 && (
            <span
              className={`px-0.5 text-[8px] font-semibold leading-none tabular-nums ${
                selected ? "text-white/60" : style.text
              }`}
            >
              ×{note.duration}
            </span>
          )}
        </>
      ) : (
        <span className="font-mono text-[10px] text-rpg-stone/30 group-hover:text-rpg-stone/70">
          {index + 1}
        </span>
      )}
    </button>
  );
}

// ── Note editor panel ──────────────────────────────────────────────────────

function NoteEditor({
  index,
  note,
  defaultWave,
  onChange,
  onDeactivate,
}: {
  index: number;
  note: SoundNote;
  defaultWave: SoundData["waveform"];
  onChange: (patch: Partial<SoundNote>) => void;
  onDeactivate: () => void;
}) {
  const active = note.note !== null;
  const wave = resolveWave(note, defaultWave);
  const style = WAVE_STYLE[wave];

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${style.text}`}
        >
          Step {index + 1}
          {active && (
            <span className="ml-2 font-normal normal-case">
              {noteName(note.note!)}{" "}
              {WAVEFORMS.find((w) => w.id === wave)?.symbol}
            </span>
          )}
        </span>
        <button
          onClick={onDeactivate}
          className={`flex items-center gap-1 text-[10px] transition ${
            active
              ? "text-rpg-blood/70 hover:text-rpg-blood"
              : "text-rpg-stone/50 hover:text-rpg-stone"
          }`}
        >
          <XIcon size={10} /> {active ? "Clear" : "Empty"}
        </button>
      </div>

      {/* Piano */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
          Tone
        </span>
        <PianoKeyboard
          value={note.note ?? DEFAULT_NOTE}
          onChange={(n) => onChange({ note: n })}
          onPreview={(n) =>
            previewNote(n, note.waveform ?? defaultWave, note.volume ?? 1, 0.3)
          }
          accentWave={wave}
        />
      </div>

      <Separator className="bg-rpg-gold/12" />

      {/* Waveform override */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
          Waveform
        </span>
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChange({ waveform: null })}
                className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-xs transition ${
                  !note.waveform
                    ? "border-rpg-gold/40 bg-rpg-gold/10 text-rpg-parchment"
                    : "border-rpg-gold/12 text-rpg-stone/70 hover:border-rpg-gold/25 hover:text-rpg-stone"
                }`}
              >
                <span className="font-mono">↺</span> Default
              </button>
            </TooltipTrigger>
            <TooltipContent>Inherit from sound</TooltipContent>
          </Tooltip>
          {WAVEFORMS.map((w) => {
            const ws = WAVE_STYLE[w.id];
            return (
              <button
                key={w.id}
                onClick={() => onChange({ waveform: w.id })}
                className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-xs transition ${
                  note.waveform === w.id
                    ? ws.btn
                    : "border-rpg-gold/12 text-rpg-stone/70 hover:border-rpg-gold/25 hover:text-rpg-stone"
                }`}
              >
                <span>{w.symbol}</span> {w.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-rpg-gold/12" />

      {/* Duration */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
          Duration
        </span>
        <div className="flex flex-col gap-1">
          {DURATIONS.map((d) => {
            const sel = (note.duration ?? 1) === d.value;
            return (
              <button
                key={d.value}
                onClick={() => onChange({ duration: d.value })}
                className={`border px-2.5 py-1.5 text-left font-mono text-xs transition ${
                  sel
                    ? style.btn
                    : "border-rpg-gold/12 text-rpg-stone/70 hover:border-rpg-gold/25 hover:text-rpg-stone"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-rpg-gold/12" />

      {/* Volume */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
          Volume
          <span className="ml-1.5 font-mono normal-case text-rpg-stone/60">
            {Math.round((note.volume ?? 1) * 100)}%
          </span>
        </span>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[note.volume ?? 1]}
          onValueChange={([v]) => onChange({ volume: v })}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function StepSequencer() {
  const { activeCartridge, selectedSoundId, updateActiveCartridge } =
    useStore();
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const sound = activeCartridge?.sounds[selectedSoundId];
  if (!sound || !activeCartridge) return null;
  const cart = activeCartridge;

  function patchSound(patch: Partial<SoundData>) {
    updateActiveCartridge({
      sounds: cart.sounds.map((s, i) =>
        i === selectedSoundId ? { ...s, ...patch } : s,
      ),
    });
  }

  function patchNote(step: number, patch: Partial<SoundNote>) {
    const notes = sound!.notes.map((n, i) =>
      i === step ? { ...n, ...patch } : n,
    );
    patchSound({ notes });
  }

  function handleStepClick(step: number) {
    const note = sound!.notes[step];
    if (note.note === null) {
      patchNote(step, {
        note: DEFAULT_NOTE,
        volume: 1,
        waveform: null,
        duration: 1,
      });
      setSelectedStep(step);
    } else {
      setSelectedStep(selectedStep === step ? null : step);
    }
  }

  function deactivateStep(step: number) {
    patchNote(step, { note: null });
  }

  const selectedNote = selectedStep !== null ? sound.notes[selectedStep] : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Transport */}
      <div className="flex shrink-0 items-center gap-3 border-b border-rpg-gold/12 px-3 py-2">
        <Button
          size="sm"
          variant="emerald"
          onClick={() => new AudioEngine(cart.sounds).sfx(selectedSoundId)}
          className="shrink-0 gap-1.5"
        >
          <PlayIcon size={12} weight="fill" /> Play
        </Button>

        <Separator orientation="vertical" className="h-5 bg-rpg-gold/12" />

        {/* Waveform */}
        <div className="flex items-center gap-1">
          {WAVEFORMS.map((w) => {
            const ws = WAVE_STYLE[w.id];
            const active = sound.waveform === w.id;
            return (
              <Tooltip key={w.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => patchSound({ waveform: w.id })}
                    className={`border px-2 py-1 text-sm transition ${
                      active
                        ? ws.btn
                        : "border-rpg-gold/12 text-rpg-stone/70 hover:border-rpg-gold/25 hover:text-rpg-stone"
                    }`}
                  >
                    {w.symbol}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{w.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-5 bg-rpg-gold/12" />

        {/* BPM */}
        <div className="flex flex-1 items-center gap-2">
          <span className="shrink-0 font-mono text-[10px] text-rpg-stone/70">
            BPM
          </span>
          <Slider
            min={40}
            max={300}
            step={1}
            value={[sound.tempo]}
            onValueChange={([v]) => patchSound({ tempo: v })}
            className="flex-1"
          />
          <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-rpg-stone/80">
            {sound.tempo}
          </span>
        </div>

        {selectedStep !== null && (
          <>
            <Separator orientation="vertical" className="h-5 bg-rpg-gold/12" />
            <button
              onClick={() => setSelectedStep(null)}
              className="text-rpg-stone/60 hover:text-rpg-parchment transition"
            >
              <XIcon size={13} />
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: Math.ceil(sound.notes.length / 4) }, (_, beat) => (
              <div key={beat} className="flex flex-col gap-3">
                <span className="font-mono text-[9px] text-rpg-stone/50">
                  Beat {beat + 1}
                </span>
                <div className="flex gap-2">
                  {sound.notes.slice(beat * 4, beat * 4 + 4).map((note, j) => {
                    const i = beat * 4 + j;
                    return (
                      <StepCell
                        key={i}
                        index={i}
                        note={note}
                        selected={selectedStep === i}
                        defaultWave={sound.waveform}
                        onClick={() => handleStepClick(i)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note editor — vertical right panel */}
        {selectedNote !== null && selectedStep !== null && (
          <>
            <Separator orientation="vertical" className="bg-white/8" />
            <div className="shrink-0 overflow-y-auto">
              <NoteEditor
                index={selectedStep}
                note={selectedNote}
                defaultWave={sound.waveform}
                onChange={(patch) => patchNote(selectedStep, patch)}
                onDeactivate={() => {
                  deactivateStep(selectedStep);
                  setSelectedStep(null);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
