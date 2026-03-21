import type { Cartridge } from "@/types/cartridge";

/**
 * Storage = user asset bytes only (sprites + scripts + maps + sounds).
 * Meta and hardware config are excluded — they are engine data, not cartridge content.
 */
export function calcStorageBytes(cartridge: Cartridge): number {
  // sprites: 1 byte per palette-index pixel
  const spriteBytes = cartridge.sprites.reduce(
    (s, sp) => s + sp.pixels.length,
    0,
  );
  // maps: each sparse tile entry = key string (~7 bytes avg) + uint16 sprite id
  const mapBytes = cartridge.maps.reduce(
    (s, m) => s + Object.keys(m.tiles).length * 9,
    0,
  );
  // scripts: UTF-8 source bytes
  const scriptBytes = cartridge.scripts.reduce(
    (s, sc) => s + sc.code.length,
    0,
  );
  // sounds: 4 bytes per note (note, volume, waveform, duration)
  const soundBytes = cartridge.sounds.reduce(
    (s, snd) => s + snd.notes.length * 4,
    0,
  );
  return spriteBytes + mapBytes + scriptBytes + soundBytes;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Editor format — pretty-printed JSON, preserves all metadata. */
export function exportLun(cartridge: Cartridge): void {
  const blob = new Blob([JSON.stringify(cartridge, null, 2)], { type: "application/json" });
  const name = cartridge.meta.name.replace(/\s+/g, "_");
  const version = cartridge.meta.version ? `_v${cartridge.meta.version}` : "";
  triggerDownload(blob, `${name}${version}.lun`);
}

/**
 * Flat / play-only format — minified, base64-encoded (not human-readable),
 * saved as `.lunx`. Cannot be re-imported for editing.
 */
export function exportFlat(cartridge: Cartridge): void {
  const flat = {
    meta: {
      id: cartridge.meta.id,
      name: cartridge.meta.name,
      author: cartridge.meta.author,
      description: cartridge.meta.description,
      version: cartridge.meta.version,
      coverArt: cartridge.meta.coverArt,
      created: cartridge.meta.created,
      updated: cartridge.meta.updated,
    },
    hardware: cartridge.hardware,
    scripts: cartridge.scripts,
    sprites: cartridge.sprites,
    maps: cartridge.maps,
    sounds: cartridge.sounds,
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(flat)));
  const blob = new Blob([encoded], { type: "application/octet-stream" });
  const name = cartridge.meta.name.replace(/\s+/g, "_");
  const version = cartridge.meta.version ? `_v${cartridge.meta.version}` : "";
  triggerDownload(blob, `${name}${version}.lunx`);
}

export function importLun(file: File): Promise<Cartridge> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Cartridge & { code?: string };
        if (!data.meta?.id) data.meta.id = crypto.randomUUID();
        // Backward compat: old format had a single `code` string
        if (!data.scripts && data.code) {
          data.scripts = [{ id: 0, name: "main", code: data.code }];
          delete data.code;
        }
        // Backward compat: fill in hardware fields added after initial release
        if (data.hardware) {
          data.hardware.spriteSize ??= 8;
          data.hardware.sfxSteps  ??= 16;
        }
        resolve(data as Cartridge);
      } catch {
        reject(new Error("Invalid .lun file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
