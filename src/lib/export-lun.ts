import type { Cartridge } from "@/types/cartridge";

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
  triggerDownload(blob, `${cartridge.meta.name.replace(/\s+/g, "_")}.lun`);
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
  triggerDownload(blob, `${cartridge.meta.name.replace(/\s+/g, "_")}.lunx`);
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
        resolve(data as Cartridge);
      } catch {
        reject(new Error("Invalid .lun file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
