import { useState, useCallback } from "react";
import {
  PlusIcon,
  XIcon,
  CpuIcon,
  MonitorIcon,
  HardDriveIcon,
  PaletteIcon,
  GameControllerIcon,
  KeyboardIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RpgDivider, RpgSectionHeader } from "@/components/rpg-ui";
import { HARDWARE_PRESETS } from "@/cartridge/hardware";
import type { HardwareConfig, InputBinding } from "@/types/cartridge";

// ── Helpers ───────────────────────────────────────────────────────────────────

type CpuUnit = "IPS" | "KIPS" | "MIPS";
type MemUnit = "B" | "KB" | "MB";

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
function displayToBytes(value: number, unit: MemUnit): number {
  if (unit === "MB") return value * 1024 * 1024;
  if (unit === "KB") return value * 1024;
  return value;
}
function buildInitialHw(baseId: string): HardwareConfig {
  return { ...HARDWARE_PRESETS.find((p) => p.id === baseId)!.hw };
}

// ── Shared select class tokens ────────────────────────────────────────────────

const selectCls = "border-rpg-gold/15 bg-surface-raised text-xs text-rpg-parchment focus:ring-rpg-gold/30";
const selectContentCls = "border-rpg-gold/20 bg-surface-overlay text-rpg-parchment";
const selectItemCls = "text-xs focus:bg-rpg-gold/8 focus:text-rpg-gold";

// ── HardwarePresetDialog ──────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, hw: HardwareConfig) => void;
}

export function HardwarePresetDialog({ open, onClose, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [baseId, setBaseId] = useState(HARDWARE_PRESETS[0].id);
  const [hw, setHw] = useState<HardwareConfig>(() => buildInitialHw(HARDWARE_PRESETS[0].id));
  const [cpuUnit, setCpuUnit] = useState<CpuUnit>(() => ipsToDisplay(hw.maxIps).unit);
  const [memUnit, setMemUnit] = useState<MemUnit>(() => bytesToDisplay(hw.maxMemBytes).unit);
  const [storageUnit, setStorageUnit] = useState<MemUnit>(() => bytesToDisplay(hw.maxStorageBytes).unit);
  const [cpuStr, setCpuStr] = useState<string>(() => String(ipsToDisplay(hw.maxIps).value));
  const [memStr, setMemStr] = useState<string>(() => String(bytesToDisplay(hw.maxMemBytes).value));
  const [storageStr, setStorageStr] = useState<string>(() => String(bytesToDisplay(hw.maxStorageBytes).value));
  const [capturingKey, setCapturingKey] = useState<number | null>(null);

  function updateHw(patch: Partial<HardwareConfig>) {
    setHw((prev) => ({ ...prev, ...patch }));
  }

  function applyBase(id: string) {
    const base = buildInitialHw(id);
    const cpu = ipsToDisplay(base.maxIps);
    const mem = bytesToDisplay(base.maxMemBytes);
    const storage = bytesToDisplay(base.maxStorageBytes);
    setBaseId(id);
    setHw(base);
    setCpuUnit(cpu.unit);
    setMemUnit(mem.unit);
    setStorageUnit(storage.unit);
    setCpuStr(String(cpu.value));
    setMemStr(String(mem.value));
    setStorageStr(String(storage.value));
  }

  function reset() {
    setName("");
    applyBase(HARDWARE_PRESETS[0].id);
  }

  // ── Palette ──

  function updatePaletteColor(i: number, hex: string) {
    const palette = [...hw.palette];
    palette[i] = hex;
    updateHw({ palette });
  }
  function addPaletteColor() {
    updateHw({ palette: [...hw.palette, "#888888"] });
  }
  function removePaletteColor(i: number) {
    if (hw.palette.length <= 2) return;
    updateHw({ palette: hw.palette.filter((_, idx) => idx !== i) });
  }

  // ── Inputs ──

  function updateInput(i: number, patch: Partial<InputBinding>) {
    updateHw({ inputs: hw.inputs.map((inp, idx) => (idx === i ? { ...inp, ...patch } : inp)) });
  }
  function addInput() {
    updateHw({
      inputs: [...hw.inputs, { button: hw.inputs.length, key: "", label: `BTN${hw.inputs.length}` }],
    });
  }
  function removeInput(i: number) {
    updateHw({ inputs: hw.inputs.filter((_, idx) => idx !== i) });
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

  function handleConfirm() {
    onConfirm(name.trim() || "Custom", hw);
    reset();
  }
  function handleClose() {
    onClose();
    reset();
  }


  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Hardware Preset</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-6 pr-3">

            {/* Name + Base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Name</Label>
                <Input
                  placeholder="My Preset"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Based on</Label>
                <Select value={baseId} onValueChange={applyBase}>
                  <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentCls}>
                    {HARDWARE_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id} className={selectItemCls}>
                        {p.name} — {p.desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Screen */}
            <RpgDivider label="Screen" />
            <RpgSectionHeader icon={MonitorIcon} title="Resolution" />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Width (px)</Label>
                <Input
                  type="number" min={32} max={512}
                  value={hw.width}
                  onChange={(e) => updateHw({ width: Math.max(32, +e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Height (px)</Label>
                <Input
                  type="number" min={32} max={512}
                  value={hw.height}
                  onChange={(e) => updateHw({ height: Math.max(32, +e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Target FPS</Label>
                <Input
                  type="number" min={1} max={240}
                  value={hw.maxFps}
                  onChange={(e) => updateHw({ maxFps: Math.max(1, Math.min(240, +e.target.value)) })}
                />
              </div>
            </div>

            {/* Assets */}
            <RpgDivider label="Assets" />
            <RpgSectionHeader icon={HardDriveIcon} title="Asset Limits" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Max Sprites</Label>
                <Input
                  type="number" min={1} max={1024}
                  value={hw.maxSprites}
                  onChange={(e) => updateHw({ maxSprites: Math.max(1, +e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Max Sounds</Label>
                <Input
                  type="number" min={1} max={256}
                  value={hw.maxSounds}
                  onChange={(e) => updateHw({ maxSounds: Math.max(1, +e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Sprite Size</Label>
                <Select value={String(hw.spriteSize ?? 8)} onValueChange={(v) => updateHw({ spriteSize: +v })}>
                  <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentCls}>
                    {[8, 16, 32].map((s) => (
                      <SelectItem key={s} value={String(s)} className={selectItemCls}>{s}×{s} px</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">SFX Steps</Label>
                <Select value={String(hw.sfxSteps ?? 16)} onValueChange={(v) => updateHw({ sfxSteps: +v })}>
                  <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
                  <SelectContent className={selectContentCls}>
                    {[8, 16, 32, 64].map((s) => (
                      <SelectItem key={s} value={String(s)} className={selectItemCls}>{s} steps</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hardware limits */}
            <RpgDivider label="Hardware" />
            <RpgSectionHeader icon={CpuIcon} title="Hardware Limits" />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">CPU Speed</Label>
                <div className="flex gap-1">
                  <Input
                    type="number" min={1}
                    value={cpuStr}
                    onChange={(e) => setCpuStr(e.target.value)}
                    onBlur={(e) => {
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n) && n > 0) updateHw({ maxIps: displayToIps(n, cpuUnit) });
                      setCpuStr(String(parseFloat((hw.maxIps / (cpuUnit === "MIPS" ? 1_000_000 : cpuUnit === "KIPS" ? 1_000 : 1)).toFixed(3))));
                    }}
                    className="min-w-0 flex-1"
                  />
                  <Select value={cpuUnit} onValueChange={(u) => { setCpuUnit(u as CpuUnit); setCpuStr(String(parseFloat((hw.maxIps / (u === "MIPS" ? 1_000_000 : u === "KIPS" ? 1_000 : 1)).toFixed(3)))); }}>
                    <SelectTrigger className={`w-16 shrink-0 ${selectCls}`}><SelectValue /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      {["IPS", "KIPS", "MIPS"].map((u) => (
                        <SelectItem key={u} value={u} className={selectItemCls}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Max RAM</Label>
                <div className="flex gap-1">
                  <Input
                    type="number" min={1}
                    value={memStr}
                    onChange={(e) => setMemStr(e.target.value)}
                    onBlur={(e) => {
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n) && n > 0) updateHw({ maxMemBytes: displayToBytes(n, memUnit) });
                      setMemStr(String(parseFloat((hw.maxMemBytes / (memUnit === "MB" ? 1024 * 1024 : memUnit === "KB" ? 1024 : 1)).toFixed(2))));
                    }}
                    className="min-w-0 flex-1"
                  />
                  <Select value={memUnit} onValueChange={(u) => { setMemUnit(u as MemUnit); setMemStr(String(parseFloat((hw.maxMemBytes / (u === "MB" ? 1024 * 1024 : u === "KB" ? 1024 : 1)).toFixed(2)))); }}>
                    <SelectTrigger className={`w-16 shrink-0 ${selectCls}`}><SelectValue /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      {["B", "KB", "MB"].map((u) => (
                        <SelectItem key={u} value={u} className={selectItemCls}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-rpg-stone">Max Storage</Label>
                <div className="flex gap-1">
                  <Input
                    type="number" min={1}
                    value={storageStr}
                    onChange={(e) => setStorageStr(e.target.value)}
                    onBlur={(e) => {
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n) && n > 0) updateHw({ maxStorageBytes: displayToBytes(n, storageUnit) });
                      setStorageStr(String(parseFloat((hw.maxStorageBytes / (storageUnit === "MB" ? 1024 * 1024 : storageUnit === "KB" ? 1024 : 1)).toFixed(2))));
                    }}
                    className="min-w-0 flex-1"
                  />
                  <Select value={storageUnit} onValueChange={(u) => { setStorageUnit(u as MemUnit); setStorageStr(String(parseFloat((hw.maxStorageBytes / (u === "MB" ? 1024 * 1024 : u === "KB" ? 1024 : 1)).toFixed(2)))); }}>
                    <SelectTrigger className={`w-16 shrink-0 ${selectCls}`}><SelectValue /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      {["B", "KB", "MB"].map((u) => (
                        <SelectItem key={u} value={u} className={selectItemCls}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Palette */}
            <RpgDivider label="Palette" />
            <RpgSectionHeader
              icon={PaletteIcon}
              title={`Color Palette (${hw.palette.length})`}
              action={
                <Button variant="ghost" size="xs" onClick={addPaletteColor} className="gap-1 text-rpg-stone hover:text-rpg-gold">
                  <PlusIcon size={10} weight="bold" /> Add
                </Button>
              }
            />
            <div className="grid grid-cols-8 gap-2">
              {hw.palette.map((hex, i) => (
                <div key={i} className="group flex flex-col items-center gap-1">
                  <div className="relative">
                    {i === 0 ? (
                      <div className="relative h-8 w-8 border border-rpg-gold/15" title="Index 0 — transparent">
                        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 32 32">
                          <line x1="0" y1="32" x2="32" y2="0" stroke="oklch(0.55 0.22 25 / 50%)" strokeWidth="2" />
                        </svg>
                      </div>
                    ) : (
                      <>
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) => updatePaletteColor(i, e.target.value)}
                          className="h-8 w-8 cursor-pointer border border-rpg-gold/15 bg-transparent p-0.5"
                          title={`Color ${i}: ${hex}`}
                        />
                        <Button
                          variant="destructive"
                          size="icon-xs"
                          onClick={() => removePaletteColor(i)}
                          className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 group-hover:flex"
                        >
                          <XIcon size={7} weight="bold" />
                        </Button>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-[8px] text-rpg-stone/50">
                    {i === 0 ? "t" : hex.slice(1).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-rpg-stone/50">Index 0 is always transparent.</p>

            {/* Controls */}
            <RpgDivider label="Controls" />
            <RpgSectionHeader
              icon={GameControllerIcon}
              title="Controls / Inputs"
              action={
                <Button variant="ghost" size="xs" onClick={addInput} className="gap-1 text-rpg-stone hover:text-rpg-gold">
                  <PlusIcon size={10} weight="bold" /> Add
                </Button>
              }
            />
            {hw.inputs.length === 0 ? (
              <p className="text-[11px] text-rpg-stone/60">No inputs defined.</p>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-[3rem_1fr_1.5fr_2rem] gap-2 px-2">
                  <span className="text-[10px] uppercase tracking-wider text-rpg-stone/50">Btn</span>
                  <span className="text-[10px] uppercase tracking-wider text-rpg-stone/50">Label</span>
                  <span className="text-[10px] uppercase tracking-wider text-rpg-stone/50">Key</span>
                  <span />
                </div>
                {hw.inputs.map((inp, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[3rem_1fr_1.5fr_2rem] items-center gap-2 border border-rpg-gold/10 bg-surface-raised px-2 py-1.5"
                  >
                    <span className="font-mono text-xs text-rpg-stone/60">{inp.button}</span>
                    <Input
                      value={inp.label}
                      onChange={(e) => updateInput(i, { label: e.target.value })}
                      placeholder="Label"
                      className="h-7 px-2 text-xs"
                    />
                    <Button
                      variant={capturingKey === i ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => startKeyCapture(i)}
                      className={`h-7 w-full justify-start gap-1.5 font-mono text-xs ${
                        capturingKey === i
                          ? "border-rpg-gold/50 text-rpg-gold"
                          : "border-rpg-gold/10 text-rpg-stone"
                      }`}
                    >
                      {capturingKey === i ? (
                        <><KeyboardIcon size={11} className="animate-pulse" /> press a key…</>
                      ) : (
                        inp.key || <span className="text-rpg-stone/40">click to bind</span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeInput(i)}
                      className="text-rpg-stone/40 hover:text-rpg-blood"
                    >
                      <XIcon size={12} weight="bold" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-rpg-gold/12 pt-4">
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={!name.trim()} className="h-8 text-xs">
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
