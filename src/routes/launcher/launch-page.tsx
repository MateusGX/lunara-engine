import { useState } from "react";
import { importFlat } from "@/cartridge/export";
import type { Cartridge } from "@/types/cartridge";
import { DropZone } from "./drop-zone";
import { CartridgeCard } from "./cartridge-card";

function parseLunx(text: string): Cartridge {
  let json = text.trim();
  try {
    json = decodeURIComponent(atob(json));
  } catch {
    // plain JSON
  }
  const data = JSON.parse(json);
  if (!data.meta || !data.hardware || (!data.scripts && !data.code)) {
    throw new Error("Invalid cartridge file");
  }
  if (!data.scripts && data.code) {
    data.scripts = [{ id: 0, name: "main", code: data.code }];
    delete data.code;
  }
  if (!data.meta.description) data.meta.description = "";
  if (!data.meta.version) data.meta.version = "1.0.0";
  if (!data.meta.created) data.meta.created = Date.now();
  if (!data.meta.updated) data.meta.updated = Date.now();
  return data as Cartridge;
}

export function LaunchPage() {
  const [cartridge, setCartridge] = useState<Cartridge | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File) {
    setError(null);
    try {
      let loaded: Cartridge;
      if (file.name.endsWith(".png") || file.type === "image/png") {
        loaded = await importFlat(file);
      } else {
        const text = await file.text();
        loaded = parseLunx(text);
      }
      setCartridge(loaded);
    } catch {
      setError("Could not read cartridge. Make sure it's a valid .png or .lun file.");
    }
  }

  if (cartridge) {
    return <CartridgeCard cartridge={cartridge} onBack={() => setCartridge(null)} />;
  }

  return <DropZone error={error} onFile={loadFile} />;
}
