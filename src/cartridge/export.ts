import type { Cartridge } from "@/types/cartridge";
import { encodeJSON, decodeJSON } from "./steg";
import { renderCartridge } from "./renderer";

export function calcStorageBytes(cartridge: Cartridge): number {
  return (
    cartridge.sprites.reduce((s, sp) => s + sp.pixels.length, 0) +
    cartridge.maps.reduce((s, m) => s + Object.keys(m.tiles).length * 9, 0) +
    cartridge.scripts.reduce((s, sc) => s + sc.code.length, 0) +
    cartridge.sounds.reduce((s, snd) => s + snd.notes.length * 4, 0)
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function filename(cartridge: Cartridge, ext: string): string {
  const name = cartridge.meta.name.replace(/\s+/g, "_");
  const v = cartridge.meta.version ? `_v${cartridge.meta.version}` : "";
  return `${name}${v}.${ext}`;
}

// ─── .lun (editor format) ─────────────────────────────────────────────────────

export function exportLun(cartridge: Cartridge): void {
  download(
    new Blob([JSON.stringify(cartridge, null, 2)], { type: "application/json" }),
    filename(cartridge, "lun"),
  );
}

// ─── PNG cartridge (steganography) ───────────────────────────────────────────

export async function exportFlat(cartridge: Cartridge): Promise<void> {
  const json = new TextEncoder().encode(JSON.stringify(cartridge));
  const requiredPixels = Math.ceil((json.length + 8) * 8 / 6);

  let w = 400, h = 600;
  while (w * h < requiredPixels) { w = Math.ceil(w * 1.5); h = Math.ceil(h * 1.5); }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  await renderCartridge(ctx, w, h, cartridge.meta.name, cartridge.meta.author, cartridge.meta.coverArt);

  const img = ctx.getImageData(0, 0, w, h);
  encodeJSON(img.data, json);
  ctx.putImageData(img, 0, 0);

  canvas.toBlob(
    (blob) => blob && download(blob, filename(cartridge, "png")),
    "image/png",
  );
}

export function importFlat(file: File): Promise<Cartridge> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const json = decodeJSON(data);
      if (!json) return reject(new Error("Not a Lunara cartridge PNG"));

      try {
        const c = JSON.parse(new TextDecoder().decode(json)) as Cartridge;
        if (!c.meta?.id) c.meta.id = crypto.randomUUID();
        resolve(c);
      } catch {
        reject(new Error("Corrupt cartridge data"));
      }
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load PNG")); };
    img.src = url;
  });
}

// ─── .lun import ─────────────────────────────────────────────────────────────

export function importLun(file: File): Promise<Cartridge> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Cartridge & { code?: string };
        if (!data.meta?.id) data.meta.id = crypto.randomUUID();
        if (!data.scripts && data.code) {
          data.scripts = [{ id: 0, name: "main", code: data.code }];
          delete data.code;
        }
        if (data.hardware) {
          data.hardware.spriteSize ??= 8;
          data.hardware.sfxSteps ??= 16;
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
