import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { get as getCartridge } from "@/db/cartridge-repository";
import type { Cartridge } from "@/types/cartridge";
import { CartridgeScreen } from "./cartridge-screen";

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cartridge, setCartridge] = useState<Cartridge | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    getCartridge(id).then((cart: Cartridge | undefined) => {
      if (cart) setCartridge(cart);
      else setNotFound(true);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin border-2 border-violet-500" />
      </div>
    );
  }

  if (notFound || !cartridge) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-black text-zinc-400">
        <p>Cartridge not found.</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-violet-400"
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="group/player flex h-screen flex-col bg-black">
      {/* Top bar — visible on hover */}
      <div className="flex items-center justify-between px-4 py-2 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1.5 text-zinc-500 hover:text-zinc-200"
        >
          <ArrowLeftIcon size={13} /> Projects
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/editor/${cartridge.meta.id}`)}
          className="gap-1.5 text-zinc-500 hover:text-zinc-200"
        >
          <PencilSimpleIcon size={13} /> Edit
        </Button>
      </div>

      {/* Game canvas */}
      <div className="flex flex-1 items-center justify-center">
        <CartridgeScreen cartridge={cartridge} />
      </div>

      {/* Bottom info strip — visible on hover */}
      <div className="flex items-center gap-4 border-t border-white/5 px-5 py-2.5 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100">
        <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
          <span className="truncate text-sm font-semibold text-zinc-200">
            {cartridge.meta.name}
          </span>
          {cartridge.meta.version && (
            <span className="shrink-0 border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500">
              v{cartridge.meta.version}
            </span>
          )}
          {cartridge.meta.author && (
            <>
              <span className="shrink-0 text-zinc-700">·</span>
              <span className="shrink-0 text-xs text-zinc-500">{cartridge.meta.author}</span>
            </>
          )}
          {cartridge.meta.description && (
            <>
              <span className="shrink-0 text-zinc-700">·</span>
              <span className="truncate text-xs text-zinc-600">{cartridge.meta.description}</span>
            </>
          )}
        </div>
        <span className="shrink-0 font-mono text-[10px] text-zinc-700">
          {cartridge.hardware.width}×{cartridge.hardware.height} · {cartridge.hardware.palette.length} colors
        </span>
      </div>
    </div>
  );
}
