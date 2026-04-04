import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { InlineEdit } from "../inline-edit";

const WAVE_COLOR: Record<string, string> = {
  sine: "bg-sky-400",
  square: "bg-rpg-gold",
  sawtooth: "bg-orange-400",
  triangle: "bg-rpg-emerald",
};

export function SoundList() {
  const {
    activeCartridge,
    selectedSoundId,
    setSelectedSoundId,
    updateActiveCartridge,
  } = useStore();

  if (!activeCartridge) return null;
  const { sounds, hardware } = activeCartridge;

  function addSound() {
    if (!activeCartridge) return;
    const newId = sounds.length;
    if (newId >= hardware.maxSounds) return;
    const steps = hardware.sfxSteps ?? 16;
    updateActiveCartridge({
      sounds: [
        ...sounds,
        {
          id: newId,
          name: `SFX ${newId}`,
          notes: Array.from({ length: steps }, () => ({
            note: null as null,
            volume: 1,
            waveform: null,
            duration: 1,
          })),
          steps,
          tempo: 120,
          waveform: "square" as const,
        },
      ],
    });
    setSelectedSoundId(newId);
  }

  function deleteSound(id: number) {
    if (!activeCartridge) return;
    const newSounds = sounds
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, id: i }));
    updateActiveCartridge({ sounds: newSounds });
    setSelectedSoundId(Math.min(id, newSounds.length - 1));
  }

  function commitRename(id: number, name: string) {
    if (!activeCartridge) return;
    updateActiveCartridge({
      sounds: sounds.map((s) =>
        s.id === id ? { ...s, name: name.trim() || `SFX ${id}` } : s,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
          Sounds ({sounds.length}/{hardware.maxSounds})
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={addSound}
          disabled={sounds.length >= hardware.maxSounds}
          className="text-rpg-stone hover:text-rpg-gold"
          title="Add sound"
        >
          <PlusIcon size={10} />
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 overflow-hidden">
        {sounds.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-1 border px-1.5 py-1 transition ${
              s.id === selectedSoundId
                ? "border-rpg-gold/35 bg-rpg-gold/8"
                : "border-transparent hover:border-rpg-gold/15 hover:bg-rpg-gold/4"
            }`}
          >
            <button
              className="shrink-0"
              onClick={() => setSelectedSoundId(s.id)}
            >
              <span
                className={`block h-2 w-2 ${WAVE_COLOR[s.waveform] ?? "bg-zinc-600"}`}
              />
            </button>

            <button
              className={`shrink-0 font-mono text-[9px] ${
                s.id === selectedSoundId ? "text-rpg-gold" : "text-rpg-stone/70"
              }`}
              onClick={() => setSelectedSoundId(s.id)}
            >
              #{s.id}
            </button>

            <div
              className="flex min-w-0 flex-1 cursor-pointer overflow-hidden"
              onClick={() => setSelectedSoundId(s.id)}
            >
              <InlineEdit
                value={s.name}
                onCommit={(name) => commitRename(s.id, name)}
                emptyLabel={`SFX ${s.id}`}
                className={`text-xs ${
                  s.id === selectedSoundId ? "text-rpg-parchment" : "text-rpg-stone"
                }`}
                onDelete={() => {
                  deleteSound(s.id);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
