import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { InlineEdit } from "../inline-edit";

export function MapList() {
  const {
    activeCartridge,
    selectedMapId,
    setSelectedMapId,
    updateActiveCartridge,
  } = useStore();

  if (!activeCartridge) return null;
  const maps = activeCartridge.maps;

  function addMap() {
    if (!activeCartridge) return;
    const newId = activeCartridge.maps.length;
    updateActiveCartridge({
      maps: [
        ...activeCartridge.maps,
        { id: newId, name: `Map ${newId + 1}`, tiles: {} },
      ],
    });
    setSelectedMapId(newId);
  }

  function deleteMap(id: number) {
    if (!activeCartridge) return;
    const newMaps = activeCartridge.maps
      .filter((m) => m.id !== id)
      .map((m, i) => ({ ...m, id: i }));
    updateActiveCartridge({ maps: newMaps });
    if (newMaps.length === 0) setSelectedMapId(0);
    else if (selectedMapId >= newMaps.length)
      setSelectedMapId(newMaps.length - 1);
    else if (selectedMapId === id) setSelectedMapId(Math.max(0, id - 1));
  }

  function commitRename(id: number, name: string) {
    if (!activeCartridge) return;
    updateActiveCartridge({
      maps: activeCartridge.maps.map((m) =>
        m.id === id ? { ...m, name: name.trim() || `Map ${id + 1}` } : m,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
          Maps ({maps.length})
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={addMap}
          className="text-rpg-stone hover:text-rpg-gold"
          title="Add map"
        >
          <PlusIcon size={10} />
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 overflow-hidden">
        {maps.map((m) => (
          <div
            key={m.id}
            className={`group flex items-center gap-1 border px-2 py-1.5 transition ${
              m.id === selectedMapId
                ? "border-rpg-gold/35 bg-rpg-gold/8"
                : "border-transparent hover:border-rpg-gold/15 hover:bg-rpg-gold/4"
            }`}
          >
            {/* Id */}
            <button
              className={`shrink-0 font-mono text-[9px] ${
                m.id === selectedMapId ? "text-rpg-gold" : "text-rpg-stone/60"
              }`}
              onClick={() => setSelectedMapId(m.id)}
            >
              #{m.id}
            </button>

            {/* Name */}
            <div
              className="flex min-w-0 flex-1 cursor-pointer overflow-hidden"
              onClick={() => setSelectedMapId(m.id)}
            >
              <InlineEdit
                value={m.name}
                onCommit={(name) => commitRename(m.id, name)}
                emptyLabel={`Map ${m.id + 1}`}
                className={`text-xs ${
                  m.id === selectedMapId ? "text-rpg-parchment" : "text-rpg-stone"
                }`}
                onDelete={() => {
                  deleteMap(m.id);
                }}
              />
            </div>

            {/* Tile count */}
            <span className="shrink-0 font-mono text-[9px] text-rpg-stone/50">
              {Object.keys(m.tiles).length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
