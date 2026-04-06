import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Cartridge } from "@/types/cartridge";
import { CartridgeScreen } from "@/routes/player/cartridge-screen";

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

export function EmbedPage() {
  const [searchParams] = useSearchParams();
  const [cartridge, setCartridge] = useState<Cartridge | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cart = searchParams.get("cart");
    if (!cart) {
      setError("No cartridge provided. Use ?cart=<lunx-data> in the URL.");
      return;
    }
    try {
      setCartridge(parseLunx(cart));
    } catch {
      setError("Could not load cartridge. Make sure the ?cart= value is valid .lunx data.");
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-black">
        <p className="font-mono text-xs text-rpg-blood">{error}</p>
        <a
          href="/"
          className="font-mono text-[10px] text-rpg-stone/40 underline hover:text-rpg-stone/70"
        >
          lunara engine
        </a>
      </div>
    );
  }

  if (!cartridge) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <span className="animate-pulse font-mono text-xs tracking-widest text-rpg-stone/40">
          loading...
        </span>
      </div>
    );
  }

  return (
    <div className="group/embed relative flex h-screen w-screen items-center justify-center bg-black">
      <CartridgeScreen
        cartridge={cartridge}
        size="min(100vw, 100vh)"
        hideHud
      />
      {/* Powered-by watermark — visible on hover */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 font-mono text-[9px] text-rpg-stone/20 opacity-0 transition-opacity duration-200 hover:text-rpg-stone/60 group-hover/embed:opacity-100"
      >
        lunara engine
      </a>
    </div>
  );
}
