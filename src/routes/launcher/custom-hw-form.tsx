const inputCls =
  "w-full border border-rpg-gold/15 bg-surface-raised px-2 py-1 font-mono text-xs text-rpg-parchment outline-none focus:border-rpg-gold/45 focus:ring-0 placeholder:text-rpg-stone/40";
const selectCls =
  "border border-rpg-gold/15 bg-surface-raised px-1.5 py-1 text-[10px] text-rpg-stone/80 outline-none focus:border-rpg-gold/45";
const labelCls = "mb-1 block text-[10px] text-rpg-stone/70";

export type CustomFields = {
  width: string; height: string;
  fps: string;
  ips: string; ipsUnit: "IPS" | "KIPS" | "MIPS";
  mem: string; memUnit: "KB" | "MB";
  storage: string; storageUnit: "KB" | "MB";
  sprites: string; sounds: string;
  spriteSize: string; sfxSteps: string;
};

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_CUSTOM_FIELDS: CustomFields = {
  width: "128", height: "128", fps: "30",
  ips: "8", ipsUnit: "MIPS",
  mem: "2", memUnit: "MB",
  storage: "512", storageUnit: "KB",
  sprites: "64", sounds: "32",
  spriteSize: "8", sfxSteps: "16",
};

interface CustomHwFormProps {
  fields: CustomFields;
  onChange: (patch: Partial<CustomFields>) => void;
}

export function CustomHwForm({ fields, onChange }: CustomHwFormProps) {
  const set = (patch: Partial<CustomFields>) => onChange(patch);
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
      <div className="col-span-2">
        <label className={labelCls}>Resolution</label>
        <div className="flex items-center gap-1.5">
          <input type="number" min={1} max={1024} value={fields.width}
            onChange={(e) => set({ width: e.target.value })} className={inputCls} />
          <span className="text-xs text-rpg-stone/50">×</span>
          <input type="number" min={1} max={1024} value={fields.height}
            onChange={(e) => set({ height: e.target.value })} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Max FPS</label>
        <input type="number" min={1} max={240} value={fields.fps}
          onChange={(e) => set({ fps: e.target.value })} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>CPU Speed</label>
        <div className="flex gap-1">
          <input type="number" min={1} value={fields.ips}
            onChange={(e) => set({ ips: e.target.value })}
            className={`min-w-0 flex-1 ${inputCls}`} />
          <select value={fields.ipsUnit}
            onChange={(e) => set({ ipsUnit: e.target.value as "IPS" | "KIPS" | "MIPS" })}
            className={selectCls}>
            <option value="IPS">IPS</option>
            <option value="KIPS">KIPS</option>
            <option value="MIPS">MIPS</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>RAM</label>
        <div className="flex gap-1">
          <input type="number" min={1} value={fields.mem}
            onChange={(e) => set({ mem: e.target.value })}
            className={`min-w-0 flex-1 ${inputCls}`} />
          <select value={fields.memUnit}
            onChange={(e) => set({ memUnit: e.target.value as "KB" | "MB" })}
            className={selectCls}>
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Max Storage</label>
        <div className="flex gap-1">
          <input type="number" min={1} value={fields.storage}
            onChange={(e) => set({ storage: e.target.value })}
            className={`min-w-0 flex-1 ${inputCls}`} />
          <select value={fields.storageUnit}
            onChange={(e) => set({ storageUnit: e.target.value as "KB" | "MB" })}
            className={selectCls}>
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Max Sprites</label>
        <input type="number" min={1} value={fields.sprites}
          onChange={(e) => set({ sprites: e.target.value })} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Max Sounds</label>
        <input type="number" min={1} value={fields.sounds}
          onChange={(e) => set({ sounds: e.target.value })} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Sprite Size</label>
        <select value={fields.spriteSize}
          onChange={(e) => set({ spriteSize: e.target.value })}
          className={`w-full ${selectCls}`}>
          {[8, 16, 32].map((s) => (
            <option key={s} value={String(s)}>{s}×{s} px</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>SFX Steps</label>
        <select value={fields.sfxSteps}
          onChange={(e) => set({ sfxSteps: e.target.value })}
          className={`w-full ${selectCls}`}>
          {[8, 16, 32, 64].map((s) => (
            <option key={s} value={String(s)}>{s} steps</option>
          ))}
        </select>
      </div>

      <p className="col-span-2 text-[10px] text-rpg-stone/50">
        Palette and inputs are inherited from the file.
      </p>
    </div>
  );
}
