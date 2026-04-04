import { useRef, useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  PencilSimpleIcon,
  CheckIcon,
  XIcon,
  LockSimpleIcon,
  CpuIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RpgFrame } from "@/components/rpg-ui";
import { HARDWARE_PRESETS } from "@/cartridge/hardware";
import { useCustomPresets } from "@/hooks/use-custom-presets";
import { HardwarePresetDialog } from "./hardware-preset-dialog";
import type { HardwareConfig } from "@/types/cartridge";

// ── PaletteDots ───────────────────────────────────────────────────────────────

function PaletteDots({ palette }: { palette: string[] }) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {palette.slice(0, 8).map((color, i) => (
        <span
          key={i}
          className="inline-block h-2.5 w-2.5 border border-rpg-gold/10"
          style={{ backgroundColor: color }}
        />
      ))}
      {palette.length > 8 && (
        <span className="flex h-2.5 items-center text-[9px] text-rpg-stone/60">
          +{palette.length - 8}
        </span>
      )}
    </div>
  );
}

// ── PresetCard ────────────────────────────────────────────────────────────────

function PresetCard({
  name,
  desc,
  hw,
  locked,
  onRename,
  onDelete,
  onExport,
}: {
  name: string;
  desc: string;
  hw: HardwareConfig;
  locked?: boolean;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
  onExport?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  function commitRename() {
    if (value.trim() && value.trim() !== name) onRename?.(value.trim());
    setEditing(false);
  }

  return (
    <RpgFrame className="group flex flex-col gap-3 p-4 transition-all hover:border-rpg-gold/35 hover:shadow-[0_0_16px_oklch(0.72_0.14_300/6%)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="h-6 px-1.5 text-xs"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={commitRename}
                className="text-rpg-gold hover:text-rpg-gold-bright"
              >
                <CheckIcon size={12} weight="bold" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditing(false)}
                className="text-rpg-stone hover:text-rpg-parchment"
              >
                <XIcon size={12} weight="bold" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-rpg-parchment">{name}</span>
              {locked && <LockSimpleIcon size={10} className="shrink-0 text-rpg-stone/50" />}
            </div>
          )}
          <p className="mt-0.5 text-[11px] text-rpg-stone/70">{desc}</p>
        </div>

        {!editing && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!locked && (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => { setValue(name); setEditing(true); }}
                  title="Rename"
                  className="text-rpg-stone hover:text-rpg-gold"
                >
                  <PencilSimpleIcon size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onDelete}
                  title="Delete"
                  className="text-rpg-stone hover:text-rpg-blood"
                >
                  <TrashIcon size={12} />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onExport}
              title="Export JSON"
              className="text-rpg-stone hover:text-rpg-gold"
            >
              <DownloadSimpleIcon size={12} />
            </Button>
          </div>
        )}
      </div>

      {/* Specs */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="text-rpg-stone/50">RES</span>
          <span className="font-mono text-rpg-parchment">{hw.width}×{hw.height}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-rpg-stone/50">FPS</span>
          <span className="font-mono text-rpg-parchment">{hw.maxFps}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-rpg-stone/50">SPR</span>
          <span className="font-mono text-rpg-parchment">{hw.maxSprites}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-rpg-stone/50">SFX</span>
          <span className="font-mono text-rpg-parchment">{hw.maxSounds}</span>
        </div>
      </div>

      <PaletteDots palette={hw.palette} />
    </RpgFrame>
  );
}

// ── HardwareProfilesTab ───────────────────────────────────────────────────────

function exportPresetJson(name: string, hw: HardwareConfig) {
  const json = JSON.stringify({ name, hw }, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/\s+/g, "_")}.preset.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function HardwareProfilesTab() {
  const { presets: customPresets, add, rename, remove } = useCustomPresets();
  const [dialogOpen, setDialogOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  function handleCreate(name: string, hw: HardwareConfig) {
    add(name, hw);
    setDialogOpen(false);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const hw: HardwareConfig = parsed.hw;
        if (!hw?.width || !hw?.height || !Array.isArray(hw?.palette)) {
          alert("Invalid preset file.");
          return;
        }
        const baseName = parsed.name ?? "Untitled";
        const existing = new Set(customPresets.map((p) => p.name));
        let uniqueName = baseName;
        let n = 2;
        while (existing.has(uniqueName)) uniqueName = `${baseName} ${n++}`;
        add(uniqueName, hw);
      } catch {
        alert("Could not read preset file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-8">
      {/* Hidden file input for import */}
      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      {/* Built-in presets */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CpuIcon size={13} className="text-rpg-gold/60" weight="bold" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/70">
            Built-in Presets
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {HARDWARE_PRESETS.map((p) => (
            <PresetCard
              key={p.id}
              name={p.name}
              desc={p.desc}
              hw={p.hw}
              locked
              onExport={() => exportPresetJson(p.name, p.hw)}
            />
          ))}
        </div>
      </section>

      {/* User presets */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CpuIcon size={13} className="text-rpg-gold/60" weight="bold" />
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/70">
              My Presets
            </h2>
            {customPresets.length > 0 && (
              <span className="border border-rpg-gold/20 bg-rpg-gold/8 px-2 py-0.5 font-mono text-[10px] text-rpg-gold/70">
                {customPresets.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => importRef.current?.click()}
              className="h-7 gap-1.5 text-xs"
            >
              <UploadSimpleIcon size={12} weight="bold" /> Import JSON
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="h-7 gap-1.5 text-xs">
              <PlusIcon size={12} weight="bold" /> New Preset
            </Button>
          </div>
        </div>

        {customPresets.length === 0 ? (
          <RpgFrame className="flex flex-col items-center justify-center border-dashed py-16 text-center">
            <CpuIcon size={28} className="mb-3 text-rpg-stone/40" weight="duotone" />
            <p className="text-sm text-rpg-stone/70">No custom presets yet</p>
            <p className="mt-1 text-xs text-rpg-stone/50">Create one based on a built-in preset or import a JSON.</p>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => importRef.current?.click()}
                className="h-7 gap-1.5 text-xs"
              >
                <UploadSimpleIcon size={12} weight="bold" /> Import JSON
              </Button>
              <Button size="sm" onClick={() => setDialogOpen(true)} className="h-7 gap-1.5 text-xs">
                <PlusIcon size={12} weight="bold" /> New Preset
              </Button>
            </div>
          </RpgFrame>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {customPresets.map((p) => (
              <PresetCard
                key={p.id}
                name={p.name}
                desc={p.desc}
                hw={p.hw}
                onRename={(newName) => rename(p.id, newName)}
                onDelete={() => remove(p.id)}
                onExport={() => exportPresetJson(p.name, p.hw)}
              />
            ))}
          </div>
        )}
      </section>

      <HardwarePresetDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleCreate}
      />
    </div>
  );
}
