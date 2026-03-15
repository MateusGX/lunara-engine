import { useNavigate } from "react-router-dom";
import {
  PlayIcon,
  PencilSimpleIcon,
  TrashIcon,
  DotsThreeIcon,
  FileCodeIcon,
  StackIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Cartridge } from "@/types/cartridge";

interface Props {
  cartridge: Cartridge;
  onDelete: (id: string) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
    new Date(ts),
  );
}

export function ProjectCard({ cartridge, onDelete }: Props) {
  const navigate = useNavigate();
  const palette = cartridge.hardware.palette;

  const totalChars = cartridge.scripts.reduce((s, sc) => s + sc.code.length, 0);

  return (
    <div className="group relative flex flex-col overflow-hidden border border-white/8 bg-[#13131f] transition hover:border-violet-500/30">
      {/* Cover / preview */}
      <div className="relative h-28 w-full overflow-hidden bg-[#0d0d14]">
        {cartridge.meta.coverArt ? (
          <img
            src={cartridge.meta.coverArt}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${palette[1] ?? "#1D2B53"}55 0%, ${palette[8] ?? "#FF004D"}22 70%, transparent 100%)`,
            }}
          />
        )}

        {/* Palette strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1">
          {palette.slice(0, 8).map((hex, i) => (
            <div key={i} className="flex-1" style={{ background: hex }} />
          ))}
        </div>

        {/* Resolution badge */}
        <span className="absolute left-2 top-2 bg-black/50 px-1.5 py-0.5 font-mono text-[9px] text-white/40 backdrop-blur-sm">
          {cartridge.hardware.width}×{cartridge.hardware.height}
        </span>

        {/* Dropdown */}
        <div className="absolute right-1.5 top-1.5" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center bg-black/50 text-zinc-400 opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:text-white">
                <DotsThreeIcon size={14} weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-white/10 bg-[#1a1a2e]">
              <DropdownMenuItem
                onClick={() => navigate(`/editor/${cartridge.meta.id}`)}
                className="cursor-pointer gap-2 text-xs focus:bg-white/8 focus:text-white"
              >
                <PencilSimpleIcon size={13} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/play/${cartridge.meta.id}`)}
                className="cursor-pointer gap-2 text-xs focus:bg-white/8 focus:text-white"
              >
                <PlayIcon size={13} weight="fill" /> Play
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/8" />
              <DropdownMenuItem
                onClick={() => onDelete(cartridge.meta.id)}
                className="cursor-pointer gap-2 text-xs text-red-400 focus:bg-red-500/10 focus:text-red-300"
              >
                <TrashIcon size={13} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-1.5">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-white">
            {cartridge.meta.name}
          </p>
          {cartridge.meta.version && (
            <Badge
              variant="outline"
              className="shrink-0 border-white/10 bg-transparent px-1 py-0 font-mono text-[9px] text-zinc-600"
            >
              v{cartridge.meta.version}
            </Badge>
          )}
        </div>

        <p className="truncate text-[11px] text-zinc-600">
          {cartridge.meta.author || "No author"}
        </p>

        {/* Stats */}
        <div className="mt-auto flex items-center gap-2.5 border-t border-white/5 pt-2 text-zinc-700">
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <StackIcon size={10} /> {cartridge.sprites.length}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <FileCodeIcon size={10} /> {totalChars > 999 ? `${(totalChars / 1000).toFixed(1)}k` : totalChars}
          </span>
          <span className="ml-auto font-mono text-[10px]">
            {timeAgo(cartridge.meta.updated)}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex border-t border-white/5">
        <button
          onClick={() => navigate(`/editor/${cartridge.meta.id}`)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] text-zinc-500 transition hover:bg-white/4 hover:text-zinc-300"
        >
          <PencilSimpleIcon size={11} /> Edit
        </button>
        <div className="w-px bg-white/5" />
        <button
          onClick={() => navigate(`/play/${cartridge.meta.id}`)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] text-violet-400 transition hover:bg-violet-500/10 hover:text-violet-300"
        >
          <PlayIcon size={11} weight="fill" /> Play
        </button>
      </div>
    </div>
  );
}
