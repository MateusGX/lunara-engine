import { CircuitryIcon } from "@phosphor-icons/react";
import { RpgSectionHeader } from "@/components/rpg-ui";
import { HARDWARE_PRESETS } from "@/cartridge/hardware";
import type { Cartridge, HardwareConfig } from "@/types/cartridge";
import { CustomHwForm, type CustomFields } from "./custom-hw-form";

const presetBtn = (active: boolean) =>
  `px-2.5 py-1 text-[11px] font-medium transition border ${
    active
      ? "border-rpg-gold/50 bg-rpg-gold/12 text-rpg-gold"
      : "border-rpg-gold/12 bg-surface-raised text-rpg-stone/70 hover:border-rpg-gold/30 hover:text-rpg-parchment"
  }`;

interface DisplayProfileProps {
  cartridge: Cartridge;
  selectedPreset: string;
  setSelectedPreset: (id: string) => void;
  customFields: CustomFields;
  setCustomFields: (patch: Partial<CustomFields>) => void;
  hwOverride: HardwareConfig | null;
  customPresets: { id: string; name: string; desc: string }[];
}

export function DisplayProfile({
  cartridge,
  selectedPreset,
  setSelectedPreset,
  customFields,
  setCustomFields,
  hwOverride,
  customPresets,
}: DisplayProfileProps) {
  function activateCustom() {
    const hw = cartridge.hardware;
    const ipsUnit = hw.maxIps >= 1_000_000 ? "MIPS" : hw.maxIps >= 1_000 ? "KIPS" : "IPS";
    const ipsVal = hw.maxIps >= 1_000_000 ? hw.maxIps / 1_000_000 : hw.maxIps >= 1_000 ? hw.maxIps / 1_000 : hw.maxIps;
    const memUnit = hw.maxMemBytes >= 1024 * 1024 ? "MB" : "KB";
    const memVal = hw.maxMemBytes >= 1024 * 1024 ? hw.maxMemBytes / (1024 * 1024) : hw.maxMemBytes / 1024;
    const storageUnit = (hw.maxStorageBytes >= 1024 * 1024 ? "MB" : "KB") as "KB" | "MB";
    const storageVal = hw.maxStorageBytes >= 1024 * 1024 ? hw.maxStorageBytes / (1024 * 1024) : hw.maxStorageBytes / 1024;
    setCustomFields({
      width: String(hw.width), height: String(hw.height),
      fps: String(hw.maxFps),
      ips: String(ipsVal), ipsUnit,
      mem: String(memVal), memUnit,
      storage: String(storageVal), storageUnit,
      sprites: String(hw.maxSprites), sounds: String(hw.maxSounds),
      spriteSize: String(hw.spriteSize ?? 8), sfxSteps: String(hw.sfxSteps ?? 16),
    });
    setSelectedPreset("custom");
  }

  const activePresetDesc =
    HARDWARE_PRESETS.find((p) => p.id === selectedPreset)?.desc ??
    customPresets.find((p) => p.id === selectedPreset)?.desc;

  return (
    <div className="px-5">
      <RpgSectionHeader icon={CircuitryIcon} title="Display Profile" className="mb-2" />
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setSelectedPreset("cartridge")} className={presetBtn(selectedPreset === "cartridge")}>
          Default
        </button>
        {HARDWARE_PRESETS.map((p) => (
          <button key={p.id} onClick={() => setSelectedPreset(p.id)} className={presetBtn(selectedPreset === p.id)}>
            {p.name}
          </button>
        ))}
        {customPresets.map((p) => (
          <button key={p.id} onClick={() => setSelectedPreset(p.id)} className={presetBtn(selectedPreset === p.id)}>
            {p.name}
          </button>
        ))}
        <button onClick={activateCustom} className={presetBtn(selectedPreset === "custom")}>
          Custom
        </button>
      </div>

      {hwOverride && selectedPreset !== "custom" && (
        <p className="mt-1.5 text-[10px] text-rpg-stone/60">
          {activePresetDesc ?? <span className="italic text-rpg-stone/40">No description provided.</span>}
          {" "}— overrides default hardware
        </p>
      )}

      {selectedPreset === "custom" && (
        <CustomHwForm fields={customFields} onChange={setCustomFields} />
      )}
    </div>
  );
}
