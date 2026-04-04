import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  UploadSimpleIcon,
  GameControllerIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { LunaraLogo } from "@/components/lunara-logo";

interface DropZoneProps {
  error: string | null;
  onFile: (file: File) => void;
}

export function DropZone({ error, onFile }: DropZoneProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-rpg-parchment">
      <header className="border-b border-rpg-gold/12 px-6 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <LunaraLogo subtitle="launcher" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="h-8 gap-1.5 text-xs text-rpg-stone/60 hover:text-rpg-parchment"
          >
            <ArrowLeftIcon size={13} /> Home
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) onFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-6 border-2 border-dashed px-8 py-16 transition ${
              dragging
                ? "border-rpg-gold/60 bg-rpg-gold/6"
                : "border-rpg-gold/15 hover:border-rpg-gold/35 hover:bg-rpg-gold/4"
            }`}
          >
            <div
              className={`flex h-16 w-16 items-center justify-center border transition ${
                dragging
                  ? "border-rpg-gold/50 bg-rpg-gold/15"
                  : "border-rpg-gold/15 bg-rpg-gold/4"
              }`}
            >
              <GameControllerIcon
                size={32}
                className={dragging ? "text-rpg-gold" : "text-rpg-stone/60"}
                weight="duotone"
              />
            </div>

            <div className="text-center">
              <p className="font-semibold text-rpg-parchment">
                {dragging ? "Release to load" : "Drop a cartridge here"}
              </p>
              <p className="mt-1.5 text-xs text-rpg-stone/60">
                Accepts{" "}
                <span className="font-mono text-rpg-stone/80">.png</span> and{" "}
                <span className="font-mono text-rpg-stone/80">.lun</span> files
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              <UploadSimpleIcon size={13} /> Browse file
            </Button>

            <input
              ref={inputRef}
              type="file"
              accept=".png,.lun,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2.5 border border-rpg-blood/25 bg-rpg-blood/8 px-4 py-3">
              <WarningCircleIcon size={14} className="mt-0.5 shrink-0 text-rpg-blood" />
              <p className="text-xs text-rpg-blood/80">{error}</p>
            </div>
          )}

          <p className="mt-5 text-center text-[11px] text-rpg-stone/50">
            Cartridges run in memory — nothing is saved to disk.
          </p>
        </div>
      </main>
    </div>
  );
}
