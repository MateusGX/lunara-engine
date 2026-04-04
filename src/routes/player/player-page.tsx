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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <div className="flex h-screen w-screen items-center justify-center bg-surface-base">
        <span className="animate-pulse font-mono text-xs tracking-widest text-rpg-stone/60">
          Loading...
        </span>
      </div>
    );
  }

  if (notFound || !cartridge) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-surface-base text-rpg-stone/70">
        <p className="font-mono text-sm">Cartridge not found.</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-rpg-gold hover:text-rpg-gold-bright"
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
          onClick={() => navigate("/studio")}
          className="gap-1.5 text-rpg-stone/60 hover:text-rpg-parchment"
        >
          <ArrowLeftIcon size={13} /> Projects
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/studio/editor/${cartridge.meta.id}`)}
          className="gap-1.5 text-rpg-stone/60 hover:text-rpg-parchment"
        >
          <PencilSimpleIcon size={13} /> Edit
        </Button>
      </div>

      {/* Game canvas */}
      <div className="flex flex-1 items-center justify-center">
        <CartridgeScreen cartridge={cartridge} />
      </div>

      {/* Bottom info strip — visible on hover */}
      <div className="flex items-center gap-4 border-t border-rpg-gold/8 px-5 py-2.5 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100">
        <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
          <span className="truncate text-sm font-semibold text-rpg-parchment">
            {cartridge.meta.name}
          </span>
          {cartridge.meta.version && (
            <span className="shrink-0 border border-rpg-gold/20 bg-rpg-gold/5 px-1.5 py-0.5 font-mono text-[9px] text-rpg-stone/60">
              v{cartridge.meta.version}
            </span>
          )}
          {cartridge.meta.author && (
            <>
              <span className="shrink-0 text-rpg-gold/30">·</span>
              <span className="shrink-0 text-xs text-rpg-stone/60">
                {cartridge.meta.author}
              </span>
            </>
          )}
          {cartridge.meta.description && (
            <>
              <span className="shrink-0 text-rpg-gold/30">·</span>
              <span className="truncate text-xs text-rpg-stone/70">
                {cartridge.meta.description}
              </span>
            </>
          )}
        </div>
        <span className="shrink-0 font-mono text-[10px] text-rpg-stone/50">
          {cartridge.hardware.width}×{cartridge.hardware.height} ·{" "}
          {cartridge.hardware.palette.length} colors
        </span>
      </div>
    </div>
  );
}
