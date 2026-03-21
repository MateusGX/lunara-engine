import { useState, useRef, useCallback } from "react";
import { useStore } from "@/store";
import { calcStorageBytes } from "@/lib/export-lun";
import { HARDWARE_PRESETS } from "@/lib/hardware-presets";
import { useCustomPresets } from "@/hooks/use-custom-presets";
import type { HardwareConfig, InputBinding } from "@/types/cartridge";
import {
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
  DownloadSimpleIcon,
  XIcon,
  CpuIcon,
  HardDriveIcon,
  GameControllerIcon,
  MonitorIcon,
  PaletteIcon,
  IdentificationCardIcon,
  KeyboardIcon,
  CircuitryIcon,
  CheckIcon,
  PencilSimpleIcon,
  FloppyDiskIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CpuUnit = "IPS" | "KIPS" | "MIPS";
type MemUnit = "B" | "KB" | "MB";
type StorageUnit = "B" | "KB" | "MB";

function ipsToDisplay(ips: number): { value: number; unit: CpuUnit } {
  if (ips >= 1_000_000) return { value: ips / 1_000_000, unit: "MIPS" };
  if (ips >= 1_000) return { value: ips / 1_000, unit: "KIPS" };
  return { value: ips, unit: "IPS" };
}

function displayToIps(value: number, unit: CpuUnit): number {
  if (unit === "MIPS") return value * 1_000_000;
  if (unit === "KIPS") return value * 1_000;
  return value;
}

function bytesToDisplay(bytes: number): { value: number; unit: MemUnit } {
  if (bytes >= 1024 * 1024) return { value: bytes / (1024 * 1024), unit: "MB" };
  if (bytes >= 1024) return { value: bytes / 1024, unit: "KB" };
  return { value: bytes, unit: "B" };
}

function displayToBytes(value: number, unit: MemUnit | StorageUnit): number {
  if (unit === "MB") return value * 1024 * 1024;
  if (unit === "KB") return value * 1024;
  return value;
}

function storageToDisplay(bytes: number): { value: number; unit: StorageUnit } {
  if (bytes >= 1024 * 1024) return { value: bytes / (1024 * 1024), unit: "MB" };
  if (bytes >= 1024) return { value: bytes / 1024, unit: "KB" };
  return { value: bytes, unit: "B" };
}

function formatBytes(b: number) {
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function UsageBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-violet-500";
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-[10px] text-zinc-500">{label}</span>
      <div className="relative h-1 flex-1 overflow-hidden bg-white/8">
        <div
          className={`absolute inset-y-0 left-0 transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-[10px] text-zinc-500">
        {used} / {total}
      </span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-zinc-500" weight="bold" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}

const RESOLUTION_PRESETS = [
  { label: "128×128", w: 128, h: 128 },
  { label: "160×120", w: 160, h: 120 },
  { label: "256×144", w: 256, h: 144 },
  { label: "320×240", w: 320, h: 240 },
];



export function SettingsTab() {
  const { activeCartridge, updateActiveCartridge } = useStore();

  const initCpu = activeCartridge
    ? ipsToDisplay(activeCartridge.hardware.maxIps)
    : { value: 8, unit: "MIPS" as CpuUnit };
  const initMem = activeCartridge
    ? bytesToDisplay(activeCartridge.hardware.maxMemBytes)
    : { value: 2, unit: "MB" as MemUnit };
  const initStorage = activeCartridge
    ? storageToDisplay(activeCartridge.hardware.maxStorageBytes ?? 512 * 1024)
    : { value: 512, unit: "KB" as StorageUnit };

  const [cpuUnit, setCpuUnit] = useState<CpuUnit>(initCpu.unit);
  const [memUnit, setMemUnit] = useState<MemUnit>(initMem.unit);
  const [storageUnit, setStorageUnit] = useState<StorageUnit>(initStorage.unit);
  const [dragging, setDragging] = useState(false);
  const [capturingKey, setCapturingKey] = useState<number | null>(null);
  const [hwImportError, setHwImportError] = useState<string | null>(null);
  const [hwDowngradeError, setHwDowngradeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hwImportRef = useRef<HTMLInputElement>(null);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const { presets: customPresets, add: addPreset, rename: renamePreset, remove: removePreset } = useCustomPresets();

  if (!activeCartridge) return null;
  const hw = activeCartridge.hardware;

  function updateMeta(patch: Partial<import("@/types/cartridge").CartridgeMeta>) {
    updateActiveCartridge({ meta: { ...activeCartridge!.meta, ...patch } });
  }

  function handleCoverFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateMeta({ coverArt: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  function updateHw(partial: Partial<HardwareConfig>) {
    updateActiveCartridge({ hardware: { ...hw, ...partial } });
  }

  function applyPreset(newHw: HardwareConfig) {
    const sz = newHw.spriteSize ?? 8;
    const spriteConflict = activeCartridge!.sprites.find(
      (s) => s.width > sz || s.height > sz,
    );
    if (spriteConflict) {
      setHwDowngradeError(
        `Sprite #${spriteConflict.id} is ${spriteConflict.width}×${spriteConflict.height} — larger than the preset's sprite size (${sz}px).`,
      );
      return;
    }
    const steps = newHw.sfxSteps ?? 16;
    const soundConflict = activeCartridge!.sounds.find((s) => s.steps > steps);
    if (soundConflict) {
      setHwDowngradeError(
        `"${soundConflict.name}" has ${soundConflict.steps} steps — more than the preset's SFX steps (${steps}).`,
      );
      return;
    }
    setHwDowngradeError(null);
    updateActiveCartridge({ hardware: { ...newHw } });
  }

  function exportHardware() {
    const presetName =
      HARDWARE_PRESETS.find((p) => hwMatches(p.hw, hw))?.name ??
      customPresets.find((p) => hwMatches(p.hw, hw))?.name ??
      activeCartridge!.meta.name;
    const json = JSON.stringify({ name: presetName, ...hw }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presetName}-hardware.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleHwImport(file: File) {
    setHwImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (
          typeof data.width !== "number" ||
          typeof data.height !== "number" ||
          !Array.isArray(data.palette)
        ) throw new Error("Invalid hardware config");

        const importedHw: HardwareConfig = { ...hw, ...data };
        updateActiveCartridge({ hardware: importedHw });

        const baseName = (typeof data.name === "string" && data.name.trim()) ? data.name.trim() : "Imported";
        const allNames = [
          ...HARDWARE_PRESETS.map((p) => p.name),
          ...customPresets.map((p) => p.name),
        ];
        let presetName = baseName;
        if (allNames.includes(presetName)) {
          let n = 2;
          while (allNames.includes(`${baseName} ${n}`)) n++;
          presetName = `${baseName} ${n}`;
        }
        addPreset(presetName, importedHw);
      } catch {
        setHwImportError("Invalid hardware config file.");
      }
    };
    reader.readAsText(file);
  }

  function hwMatches(a: HardwareConfig, b: HardwareConfig) {
    return (
      a.width === b.width &&
      a.height === b.height &&
      a.maxFps === b.maxFps &&
      a.maxIps === b.maxIps &&
      a.palette.length === b.palette.length
    );
  }
  const activePresetId =
    HARDWARE_PRESETS.find((p) => hwMatches(p.hw, hw))?.id ??
    customPresets.find((p) => hwMatches(p.hw, hw))?.id ??
    null;

  function updatePaletteColor(index: number, hex: string) {
    const palette = [...hw.palette];
    palette[index] = hex;
    updateHw({ palette });
  }

  function addPaletteColor() {
    updateHw({ palette: [...hw.palette, "#888888"] });
  }

  function removePaletteColor(index: number) {
    if (hw.palette.length <= 2) return;
    updateHw({ palette: hw.palette.filter((_: string, i: number) => i !== index) });
  }

  function updateInput(index: number, patch: Partial<InputBinding>) {
    const inputs = hw.inputs.map((inp: InputBinding, i: number) =>
      i === index ? { ...inp, ...patch } : inp,
    );
    updateHw({ inputs });
  }

  function addInput() {
    updateHw({
      inputs: [
        ...hw.inputs,
        { button: hw.inputs.length, key: "", label: `BTN${hw.inputs.length}` },
      ],
    });
  }

  function removeInput(index: number) {
    updateHw({ inputs: hw.inputs.filter((_: InputBinding, i: number) => i !== index) });
  }

  const startKeyCapture = useCallback(
    (index: number) => {
      setCapturingKey(index);
      const handler = (e: KeyboardEvent) => {
        e.preventDefault();
        updateInput(index, { key: e.key });
        setCapturingKey(null);
        window.removeEventListener("keydown", handler);
      };
      window.addEventListener("keydown", handler);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hw.inputs],
  );

  const storageUsed = calcStorageBytes(activeCartridge);
  const storageLimit = hw.maxStorageBytes ?? 512 * 1024;
  const storagePct = Math.min(100, Math.round((storageUsed / storageLimit) * 100));
  const storageOver = storageUsed > storageLimit;

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-2xl space-y-8 p-6">

        {/* ── Project Info ── */}
        <section className="space-y-4">
          <SectionHeader icon={IdentificationCardIcon} title="Project Info" />
          <Separator className="bg-white/8" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Name</Label>
              <Input
                value={activeCartridge.meta.name}
                onChange={(e) => updateMeta({ name: e.target.value })}
                placeholder="My Game"
                className="border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Author</Label>
              <Input
                value={activeCartridge.meta.author}
                onChange={(e) => updateMeta({ author: e.target.value })}
                placeholder="your name"
                className="border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-zinc-400">Description</Label>
              <textarea
                value={activeCartridge.meta.description}
                onChange={(e) => updateMeta({ description: e.target.value })}
                placeholder="A short description of your game…"
                rows={2}
                className="w-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Version</Label>
              <Input
                value={activeCartridge.meta.version}
                onChange={(e) => updateMeta({ version: e.target.value })}
                placeholder="1.0.0"
                className="border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">ID</Label>
              <Input
                value={activeCartridge.meta.id}
                readOnly
                className="border-white/5 bg-white/3 font-mono text-xs text-zinc-600 focus-visible:ring-0"
              />
            </div>
          </div>
        </section>

        {/* ── Cover Art ── */}
        <section className="space-y-4">
          <SectionHeader icon={UploadSimpleIcon} title="Cover Art" />
          <Separator className="bg-white/8" />

          <div className="flex gap-4">
            <div
              className={`relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 transition ${
                dragging
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-dashed border-white/15 bg-white/3 hover:border-white/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleCoverFile(file);
              }}
            >
              {activeCartridge.meta.coverArt ? (
                <img
                  src={activeCartridge.meta.coverArt}
                  alt="Cover art"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-zinc-600">
                  <UploadSimpleIcon size={20} />
                  <span className="text-center text-[10px] leading-tight">
                    Drop or click
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverFile(file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="flex flex-col justify-between py-1">
              <div className="space-y-1">
                <p className="text-xs text-zinc-300">
                  {activeCartridge.meta.coverArt ? "Cover art set" : "No cover art"}
                </p>
                <p className="text-[10px] text-zinc-600">
                  PNG, JPG or GIF · shown on the project card
                </p>
              </div>
              {activeCartridge.meta.coverArt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateMeta({ coverArt: undefined })}
                  className="w-fit gap-1.5 text-xs text-red-500/60 hover:bg-red-500/10 hover:text-red-400"
                >
                  <XIcon size={12} /> Remove
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ── Hardware Profile ── */}
        <section className="space-y-4">
          <SectionHeader
            icon={CircuitryIcon}
            title="Hardware Profile"
            action={
              <div className="flex items-center gap-1.5">
                <input
                  ref={hwImportRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleHwImport(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => hwImportRef.current?.click()}
                  className="gap-1 border-white/10 bg-transparent text-zinc-400 hover:bg-white/8 hover:text-white"
                >
                  <UploadSimpleIcon size={11} /> Import
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={exportHardware}
                  className="gap-1 border-white/10 bg-transparent text-zinc-400 hover:bg-white/8 hover:text-white"
                >
                  <DownloadSimpleIcon size={11} /> Export
                </Button>
              </div>
            }
          />
          <Separator className="bg-white/8" />

          {/* ── Default presets ── */}
          <div className="grid grid-cols-3 gap-2">
            {HARDWARE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.hw)}
                className={`flex flex-col items-start gap-1.5 border px-3 py-2.5 text-left transition ${
                  activePresetId === p.id
                    ? "border-violet-500/60 bg-violet-600/10 text-white"
                    : "border-white/8 bg-white/3 text-zinc-400 hover:border-white/20 hover:bg-white/6 hover:text-zinc-200"
                }`}
              >
                <div className="flex h-1.5 w-full overflow-hidden">
                  {p.hw.palette.slice(1, 9).map((c, i) => (
                    <div key={i} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
                <span className={`text-xs font-semibold ${activePresetId === p.id ? "text-violet-300" : ""}`}>
                  {p.name}
                </span>
                <span className="text-[10px] leading-tight opacity-60">{p.desc}</span>
              </button>
            ))}
            {/* Custom indicator — highlighted when no preset matches */}
            <div
              className={`flex flex-col items-start gap-1.5 border px-3 py-2.5 text-left ${
                activePresetId === null && customPresets.length === 0
                  ? "border-violet-500/60 bg-violet-600/10 text-white"
                  : "border-white/8 bg-white/3 text-zinc-400"
              }`}
            >
              <div className="flex h-1.5 w-full overflow-hidden">
                {hw.palette.slice(1, 9).map((c: string, i: number) => (
                  <div key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <span className={`text-xs font-semibold ${activePresetId === null && customPresets.length === 0 ? "text-violet-300" : ""}`}>
                Custom
              </span>
              <span className="text-[10px] leading-tight opacity-60">
                {hw.width}×{hw.height} · {hw.maxFps}fps · {hw.palette.length} colors
              </span>
            </div>
          </div>

          {/* ── User presets ── */}
          {customPresets.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                My Presets
              </span>
              <div className="grid grid-cols-3 gap-2">
                {customPresets.map((p) => (
                  <div
                    key={p.id}
                    className={`group/preset relative flex flex-col items-start gap-1.5 border px-3 pb-8 pt-2.5 text-left transition ${
                      activePresetId === p.id
                        ? "border-violet-500/60 bg-violet-600/10 text-white"
                        : "border-white/8 bg-white/3 text-zinc-400 hover:border-white/20 hover:bg-white/6"
                    }`}
                  >
                    {/* Apply on click (not on action buttons) */}
                    <button
                      className="absolute inset-0"
                      onClick={() => applyPreset(p.hw)}
                    />
                    <div className="flex h-1.5 w-full overflow-hidden">
                      {p.hw.palette.slice(1, 9).map((c, i) => (
                        <div key={i} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    {renamingId === p.id ? (
                      <form
                        className="relative z-10 flex w-full gap-1"
                        onSubmit={(e) => {
                          e.preventDefault();
                          renamePreset(p.id, renameValue);
                          setRenamingId(null);
                        }}
                      >
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => setRenamingId(null)}
                          className="min-w-0 flex-1 bg-white/10 px-1.5 py-0.5 text-xs text-white outline-none focus:ring-1 focus:ring-violet-500/60"
                        />
                        <button type="submit" className="relative z-10 text-violet-400 hover:text-violet-300">
                          <CheckIcon size={12} />
                        </button>
                      </form>
                    ) : (
                      <span className={`relative z-10 text-xs font-semibold ${activePresetId === p.id ? "text-violet-300" : ""}`}>
                        {p.name}
                      </span>
                    )}
                    <span className="text-[10px] leading-tight opacity-60">{p.desc}</span>
                    {/* Actions */}
                    <div className="absolute inset-x-0 bottom-0 z-10 hidden items-center justify-end gap-px border-t border-white/8 bg-[#13131f] group-hover/preset:flex">
                      <button
                        onClick={() => { setRenamingId(p.id); setRenameValue(p.name); }}
                        className="flex flex-1 items-center justify-center gap-1 py-1.5 text-[10px] text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                      >
                        <PencilSimpleIcon size={11} /> Rename
                      </button>
                      <div className="h-3 w-px bg-white/10" />
                      <button
                        onClick={() => removePreset(p.id)}
                        className="flex flex-1 items-center justify-center gap-1 py-1.5 text-[10px] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <TrashIcon size={11} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Save current as preset ── */}
          {savingName !== null ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (savingName.trim()) {
                  addPreset(savingName.trim(), hw);
                  setSavingName(null);
                }
              }}
            >
              <input
                autoFocus
                placeholder="Preset name…"
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                className="flex-1 border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-violet-500/60"
              />
              <Button size="xs" type="submit" disabled={!savingName.trim()} className="gap-1 bg-violet-600 hover:bg-violet-500">
                <FloppyDiskIcon size={11} /> Save
              </Button>
              <Button size="xs" variant="ghost" type="button" onClick={() => setSavingName(null)} className="text-zinc-500">
                <XIcon size={11} />
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setSavingName("")}
              className="w-fit gap-1.5 border-white/10 bg-transparent text-zinc-400 hover:border-violet-500/40 hover:bg-violet-500/8 hover:text-violet-300"
            >
              <PlusIcon size={11} /> Save current as preset
            </Button>
          )}

          {hwImportError && (
            <p className="text-[11px] text-red-400">{hwImportError}</p>
          )}

          <p className="text-[10px] text-zinc-700">
            Presets replace all hardware settings. Customize the fields below. Export saves the current config as JSON.
          </p>
        </section>

        {/* ── Screen ── */}
        <section className="space-y-4">
          <SectionHeader icon={MonitorIcon} title="Screen Resolution" />
          <Separator className="bg-white/8" />

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Width (px)</Label>
              <Input
                type="number"
                min={32}
                max={512}
                value={hw.width}
                onChange={(e) => updateHw({ width: +e.target.value })}
                className="w-24 border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Height (px)</Label>
              <Input
                type="number"
                min={32}
                max={512}
                value={hw.height}
                onChange={(e) => updateHw({ height: +e.target.value })}
                className="w-24 border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Presets</Label>
              <div className="flex gap-1">
                {RESOLUTION_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant={hw.width === p.w && hw.height === p.h ? "default" : "outline"}
                    size="xs"
                    onClick={() => updateHw({ width: p.w, height: p.h })}
                    className={`font-mono text-[10px] ${
                      hw.width === p.w && hw.height === p.h
                        ? "bg-violet-600 hover:bg-violet-500"
                        : "border-white/10 bg-transparent text-zinc-400 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Counts ── */}
        <section className="space-y-4">
          <SectionHeader icon={HardDriveIcon} title="Asset Limits" />
          <Separator className="bg-white/8" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Max Sprites</Label>
              <Input
                type="number"
                min={1}
                max={1024}
                value={hw.maxSprites}
                onChange={(e) => updateHw({ maxSprites: +e.target.value })}
                className="border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Max Sounds</Label>
              <Input
                type="number"
                min={1}
                max={256}
                value={hw.maxSounds}
                onChange={(e) => updateHw({ maxSounds: +e.target.value })}
                className="border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Sprite Size</Label>
              <Select
                value={String(hw.spriteSize ?? 8)}
                onValueChange={(v) => {
                  const newSize = +v;
                  const conflict = activeCartridge.sprites.find(
                    (s) => s.width > newSize || s.height > newSize,
                  );
                  if (conflict) {
                    setHwDowngradeError(
                      `Sprite #${conflict.id} is ${conflict.width}×${conflict.height} — resize or delete it first.`,
                    );
                    return;
                  }
                  setHwDowngradeError(null);
                  updateHw({ spriteSize: newSize });
                }}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[8, 16, 32].map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}×{s} px</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">SFX Steps</Label>
              <Select
                value={String(hw.sfxSteps ?? 16)}
                onValueChange={(v) => {
                  const newSteps = +v;
                  const conflict = activeCartridge.sounds.find(
                    (s) => s.steps > newSteps,
                  );
                  if (conflict) {
                    setHwDowngradeError(
                      `"${conflict.name}" has ${conflict.steps} steps — reduce it first.`,
                    );
                    return;
                  }
                  setHwDowngradeError(null);
                  const resizedSounds = activeCartridge.sounds.map((s) => {
                    if (s.steps === newSteps) return s;
                    const notes = Array.from({ length: newSteps }, (_, i) =>
                      i < s.notes.length
                        ? s.notes[i]
                        : { note: null as null, volume: 1, waveform: null, duration: 1 },
                    );
                    return { ...s, steps: newSteps, notes };
                  });
                  updateActiveCartridge({ hardware: { ...hw, sfxSteps: newSteps }, sounds: resizedSounds });
                }}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[8, 16, 32, 64].map((s) => (
                    <SelectItem key={s} value={String(s)}>{s} steps</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hwDowngradeError && (
            <p className="text-[11px] text-red-400">{hwDowngradeError}</p>
          )}

          {/* Live usage */}
          <div className="space-y-2 border border-white/8 bg-white/3 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              Current Usage
            </span>
            <UsageBar
              used={activeCartridge.sprites.length}
              total={hw.maxSprites}
              label="Sprites"
            />
            <UsageBar
              used={activeCartridge.sounds.length}
              total={hw.maxSounds}
              label="Sounds"
            />
          </div>
        </section>

        {/* ── Resource Limits ── */}
        <section className="space-y-4">
          <SectionHeader icon={CpuIcon} title="Hardware Limits" />
          <Separator className="bg-white/8" />

          <div className="grid grid-cols-3 gap-4">
            {/* FPS */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Target FPS</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min={1}
                  max={240}
                  step={1}
                  value={hw.maxFps ?? 60}
                  onChange={(e) =>
                    updateHw({ maxFps: Math.max(1, Math.min(240, Math.round(+e.target.value))) })
                  }
                  className="min-w-0 flex-1 border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
                />
                <span className="flex items-center px-2 text-xs text-zinc-500">fps</span>
              </div>
              <p className="text-[10px] text-zinc-700">{(hw.maxIps / (hw.maxFps ?? 60)).toLocaleString(undefined, { maximumFractionDigits: 0 })} instr/frame</p>
            </div>

            {/* CPU */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">CPU Speed</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min={1}
                  step={cpuUnit === "MIPS" ? 0.5 : cpuUnit === "KIPS" ? 100 : 1000}
                  value={parseFloat(ipsToDisplay(hw.maxIps).value.toFixed(3))}
                  onChange={(e) =>
                    updateHw({ maxIps: Math.max(1, displayToIps(+e.target.value, cpuUnit)) })
                  }
                  className="min-w-0 flex-1 border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
                />
                <Select value={cpuUnit} onValueChange={(u) => setCpuUnit(u as CpuUnit)}>
                  <SelectTrigger className="w-16 shrink-0 border-white/10 bg-white/5 text-xs text-zinc-300 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1a1a2e]">
                    {["IPS", "KIPS", "MIPS"].map((u) => (
                      <SelectItem key={u} value={u} className="text-xs text-zinc-300">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-zinc-700">{hw.maxIps.toLocaleString()} IPS</p>
            </div>

            {/* RAM */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Max RAM</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min={1}
                  value={parseFloat(bytesToDisplay(hw.maxMemBytes).value.toFixed(2))}
                  onChange={(e) =>
                    updateHw({ maxMemBytes: Math.max(1, displayToBytes(+e.target.value, memUnit)) })
                  }
                  className="min-w-0 flex-1 border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
                />
                <Select value={memUnit} onValueChange={(u) => setMemUnit(u as MemUnit)}>
                  <SelectTrigger className="w-16 shrink-0 border-white/10 bg-white/5 text-xs text-zinc-300 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1a1a2e]">
                    {["B", "KB", "MB"].map((u) => (
                      <SelectItem key={u} value={u} className="text-xs text-zinc-300">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-zinc-700">{formatBytes(hw.maxMemBytes)}</p>
            </div>

            {/* Storage */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Max Storage</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min={1}
                  value={parseFloat(storageToDisplay(storageLimit).value.toFixed(2))}
                  onChange={(e) =>
                    updateHw({
                      maxStorageBytes: Math.max(1, displayToBytes(+e.target.value, storageUnit)),
                    })
                  }
                  className="min-w-0 flex-1 border-white/10 bg-white/5 text-white focus-visible:border-violet-500 focus-visible:ring-0"
                />
                <Select value={storageUnit} onValueChange={(u) => setStorageUnit(u as StorageUnit)}>
                  <SelectTrigger className="w-16 shrink-0 border-white/10 bg-white/5 text-xs text-zinc-300 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1a1a2e]">
                    {["B", "KB", "MB"].map((u) => (
                      <SelectItem key={u} value={u} className="text-xs text-zinc-300">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className={`text-[10px] ${storageOver ? "text-red-400" : "text-zinc-700"}`}>
                {formatBytes(storageUsed)} used ({storagePct}%){storageOver ? " — over limit!" : ""}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-zinc-700">
            CPU: simulation stops after 3 consecutive frames over budget.
            RAM: stops at startup if exceeded.
            Storage: max serialized cartridge size.
          </p>
        </section>

        {/* ── Palette ── */}
        <section className="space-y-4">
          <SectionHeader
            icon={PaletteIcon}
            title={`Color Palette (${hw.palette.length} colors)`}
            action={
              <Button
                variant="outline"
                size="xs"
                onClick={addPaletteColor}
                className="border-white/10 bg-transparent text-zinc-400 hover:bg-white/8 hover:text-white"
              >
                <PlusIcon size={11} className="mr-1" /> Add
              </Button>
            }
          />
          <Separator className="bg-white/8" />

          <div className="grid grid-cols-8 gap-2">
            {hw.palette.map((hex: string, i: number) => (
              <div key={i} className="group flex flex-col items-center gap-1">
                <div className="relative">
                  {i === 0 ? (
                    <div
                      className="relative h-10 w-10 border-2 border-white/10"
                      title="Index 0 — transparent (cannot be changed)"
                    >
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40">
                        <line x1="0" y1="40" x2="40" y2="0" stroke="rgba(255,80,80,0.6)" strokeWidth="2" />
                      </svg>
                    </div>
                  ) : (
                    <>
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => updatePaletteColor(i, e.target.value)}
                        className="h-10 w-10 cursor-pointer border-2 border-white/10 bg-transparent p-0.5"
                        title={`Color ${i}: ${hex}`}
                      />
                      <button
                        onClick={() => removePaletteColor(i)}
                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center bg-red-600 text-white group-hover:flex"
                      >
                        <XIcon size={8} weight="bold" />
                      </button>
                    </>
                  )}
                </div>
                <span className="font-mono text-[9px] text-zinc-600">
                  {i === 0 ? "transp." : hex.slice(1).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-700">
            Index 0 is always transparent — used as the clear color in sprites and maps.
          </p>
        </section>

        {/* ── Controls ── */}
        <section className="space-y-4">
          <SectionHeader
            icon={GameControllerIcon}
            title="Controls / Inputs"
            action={
              <Button
                variant="outline"
                size="xs"
                onClick={addInput}
                className="border-white/10 bg-transparent text-zinc-400 hover:bg-white/8 hover:text-white"
              >
                <PlusIcon size={11} className="mr-1" /> Add
              </Button>
            }
          />
          <Separator className="bg-white/8" />

          {hw.inputs.length === 0 ? (
            <p className="text-[11px] text-zinc-600">No inputs defined. Add a button to map keyboard keys.</p>
          ) : (
            <div className="space-y-1.5">
              {/* Header */}
              <div className="grid grid-cols-[3rem_1fr_1.5fr_2rem] gap-2 px-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-700">Btn</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-700">Label</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-700">Key</span>
                <span />
              </div>

              {hw.inputs.map((inp: InputBinding, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[3rem_1fr_1.5fr_2rem] items-center gap-2 border border-white/8 bg-white/3 px-2 py-2"
                >
                  <span className="font-mono text-xs text-zinc-600">{inp.button}</span>

                  <Input
                    value={inp.label}
                    onChange={(e) => updateInput(i, { label: e.target.value })}
                    placeholder="Label"
                    className="h-7 border-white/8 bg-transparent px-2 text-xs text-white focus-visible:border-violet-500 focus-visible:ring-0"
                  />

                  <button
                    onClick={() => startKeyCapture(i)}
                    className={`flex h-7 w-full items-center gap-1.5 border px-2 text-left font-mono text-xs transition ${
                      capturingKey === i
                        ? "border-violet-500 bg-violet-500/10 text-violet-300"
                        : "border-white/8 bg-transparent text-zinc-300 hover:border-white/20"
                    }`}
                    title="Click and press a key to bind"
                  >
                    <KeyboardIcon size={11} className="shrink-0 text-zinc-600" />
                    {capturingKey === i ? (
                      <span className="text-violet-400">press a key…</span>
                    ) : (
                      <span className={inp.key ? "text-zinc-300" : "text-zinc-600"}>
                        {inp.key || "click to bind"}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => removeInput(i)}
                    className="flex h-7 w-8 items-center justify-center text-zinc-700 transition hover:text-red-400"
                  >
                    <TrashIcon size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ScrollArea>
  );
}
