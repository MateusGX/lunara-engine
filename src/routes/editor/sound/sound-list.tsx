import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { InlineEdit } from "../inline-edit";

const WAVE_COLOR: Record<string, string> = {
  sine: "bg-blue-500",
  square: "bg-violet-500",
  sawtooth: "bg-orange-500",
  triangle: "bg-emerald-500",
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
    updateActiveCartridge({
      sounds: [
        ...sounds,
        {
          id: newId,
          name: `SFX ${newId}`,
          notes: Array.from({ length: 16 }, () => ({
            note: null as null,
            volume: 1,
            waveform: null,
            duration: 1,
          })),
          steps: 16,
          tempo: 120,
          waveform: "square" as const,
        },
      ],
    });
    setSelectedSoundId(newId);
  }

  function deleteSound(id: number) {
    if (!activeCartridge || sounds.length <= 1) return;
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
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          Sounds ({sounds.length}/{hardware.maxSounds})
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={addSound}
          disabled={sounds.length >= hardware.maxSounds}
          className="text-zinc-500 hover:text-zinc-300"
          title="Add sound"
        >
          <PlusIcon size={10} />
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 overflow-hidden">
        {sounds.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-1.5 border px-1.5 py-1 transition ${
              s.id === selectedSoundId
                ? "border-violet-500/40 bg-violet-600/10"
                : "border-transparent hover:border-white/8 hover:bg-white/4"
            }`}
          >
            <button className="shrink-0" onClick={() => setSelectedSoundId(s.id)}>
              <span className={`block h-2 w-2 ${WAVE_COLOR[s.waveform] ?? "bg-zinc-600"}`} />
            </button>

            <button
              className={`shrink-0 font-mono text-[9px] ${
                s.id === selectedSoundId ? "text-violet-400" : "text-zinc-600"
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
                  s.id === selectedSoundId ? "text-zinc-200" : "text-zinc-400"
                }`}
              />
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); deleteSound(s.id); }}
              disabled={sounds.length <= 1}
              className="flex h-5 w-5 shrink-0 items-center justify-center text-zinc-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100 disabled:opacity-20"
            >
              <TrashIcon size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
