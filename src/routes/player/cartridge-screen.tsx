import { useEffect, useRef, useState } from "react";
import { CartridgeRunner } from "@/engine";
import { useStore } from "@/store";
import { ResourceMonitor } from "@/components/resource-monitor";
import type { Cartridge } from "@/types/cartridge";

interface Props {
  cartridge: Cartridge;
}

function fmtIps(ips: number): string {
  if (ips >= 1_000_000) return `${(ips / 1_000_000).toFixed(1)} MIPS`;
  if (ips >= 1_000) return `${(ips / 1_000).toFixed(1)} KIPS`;
  return `${ips} IPS`;
}

function fmtBytes(b: number): string {
  if (!isFinite(b)) return "∞";
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`;
  if (b >= 1_024) return `${(b / 1_024).toFixed(1)} KB`;
  return `${b} B`;
}

export function CartridgeScreen({ cartridge }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runnerRef = useRef<CartridgeRunner | null>(null);
  const { addMessage } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [crashed, setCrashed] = useState<string | null>(null);
  const [stats, setStats] = useState({ cpu: 0, mem: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCrashed(null);
    setError(null);

    const runner = new CartridgeRunner({
      onPrint: (msg: string) => addMessage("log", msg),
      onError: (msg: string) => {
        addMessage("error", msg);
        setError(msg);
      },
      onCrash: (msg: string) => {
        addMessage("error", msg);
        setCrashed(msg);
      },
      onStats: (cpu, mem) => setStats({ cpu, mem }),
    });
    runnerRef.current = runner;

    runner.start(cartridge, canvas).catch((err: unknown) => {
      setCrashed(String(err));
    });

    return () => {
      runner.stop();
      runnerRef.current = null;
    };
  }, [cartridge, addMessage]);

  const { inputs } = cartridge.hardware;

  const canvasSize = "min(70vw, 70vh)";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Canvas + overlays */}
      <div className="group relative">
        <canvas
          ref={canvasRef}
          style={{
            imageRendering: "pixelated",
            width: canvasSize,
            height: "auto",
            aspectRatio: `${cartridge.hardware.width} / ${cartridge.hardware.height}`,
            border: "1px solid rgba(162,89,239,0.18)",
            display: "block",
            transition: "width 0.2s ease",
          }}
        />

        {/* Non-fatal error banner */}
        {error && !crashed && (
          <div className="absolute bottom-0 left-0 right-0 bg-rpg-blood/20 px-4 py-2 backdrop-blur">
            <p className="font-mono text-xs text-rpg-blood/80">{error}</p>
          </div>
        )}

        {/* Crash overlay */}
        {crashed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
            <p className="mb-1 font-mono text-base font-bold text-rpg-blood">
              CRASH
            </p>
            <p className="mb-3 font-mono text-[11px] text-rpg-stone/60">
              the cartridge stopped due to an error
            </p>
            <div className="max-w-xs border border-rpg-blood/25 bg-rpg-blood/10 px-4 py-2">
              <p className="break-all font-mono text-xs text-rpg-blood/80">
                {crashed}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hardware info + live stats */}
      <div className="flex w-full max-w-md flex-col gap-1.5 border border-rpg-gold/12 bg-rpg-gold/3 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rpg-gold/70">
            Hardware
          </span>
          <ResourceMonitor cpu={stats.cpu} mem={stats.mem} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <HwStat label="RES" value={`${cartridge.hardware.width}×${cartridge.hardware.height}`} />
          <HwStat label="FPS" value={`${cartridge.hardware.maxFps ?? 60} fps`} />
          <HwStat label="CPU" value={fmtIps(cartridge.hardware.maxIps)} />
          <HwStat label="MEM" value={fmtBytes(cartridge.hardware.maxMemBytes)} />
          <HwStat label="SPR" value={String(cartridge.hardware.maxSprites)} />
          <HwStat label="SND" value={String(cartridge.hardware.maxSounds)} />
          <HwStat label="STG" value={fmtBytes(cartridge.hardware.maxStorageBytes ?? 512 * 1024)} />
          <HwStat label="PAL" value={`${cartridge.hardware.palette.length} colors`} />
        </div>
      </div>

      {/* Inputs legend */}
      {inputs.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {inputs.map((inp) => (
            <div key={inp.button} className="flex items-center gap-1.5">
              <kbd className="border border-rpg-gold/20 bg-rpg-gold/8 px-2 py-0.5 font-mono text-[11px] text-rpg-stone/80">
                {inp.key}
              </kbd>
              <span className="font-mono text-[11px] text-rpg-stone/70">
                {inp.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HwStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-rpg-stone/60">{label}</span>
      <span className="font-mono text-[11px] text-rpg-parchment">{value}</span>
    </div>
  );
}
