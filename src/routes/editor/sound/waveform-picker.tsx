import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import type { SoundData } from "@/types/cartridge";

const WAVEFORMS: { id: SoundData["waveform"]; label: string; shape: string }[] = [
  { id: "sine", label: "Sine", shape: "∿" },
  { id: "square", label: "Square", shape: "⊓" },
  { id: "sawtooth", label: "Sawtooth", shape: "⊿" },
  { id: "triangle", label: "Triangle", shape: "⋀" },
];

export function WaveformPicker() {
  const { activeCartridge, selectedSoundId, updateActiveCartridge } = useStore();
  const sound = activeCartridge?.sounds[selectedSoundId];
  if (!sound || !activeCartridge) return null;

  function setWaveform(w: SoundData["waveform"]) {
    const sounds = activeCartridge!.sounds.map((s, i) =>
      i === selectedSoundId ? { ...s, waveform: w } : s
    );
    updateActiveCartridge({ sounds });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
        Waveform
      </span>
      <div className="flex gap-1.5">
        {WAVEFORMS.map((w) => (
          <Button
            key={w.id}
            variant={sound.waveform === w.id ? "default" : "outline"}
            size="sm"
            onClick={() => setWaveform(w.id)}
            title={w.label}
            className={
              sound.waveform === w.id
                ? "bg-rpg-gold text-surface-base hover:bg-rpg-gold-bright"
                : "border-rpg-gold/15 bg-transparent text-rpg-stone/70 hover:bg-rpg-gold/8 hover:text-rpg-parchment"
            }
          >
            <span className="text-base leading-none">{w.shape}</span>
            <span className="ml-1 text-[10px]">{w.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
