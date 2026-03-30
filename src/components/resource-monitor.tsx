import { useStore } from "@/store";
import { countTokens } from "@/editor/token-counter";
import { useMemo } from "react";

interface Props {
  cpu: number;
  mem: number;
}

export function ResourceMonitor({ cpu, mem }: Props) {
  const { activeCartridge } = useStore();
  const tokens = useMemo(
    () => activeCartridge
      ? activeCartridge.scripts.reduce((sum, s) => sum + countTokens(s.code), 0)
      : 0,
    [activeCartridge?.scripts],
  );

  const cpuColor =
    cpu > 80 ? "text-red-400" : cpu > 50 ? "text-yellow-400" : "text-emerald-400";

  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      <span title="CPU usage" className="flex items-center gap-1.5">
        <span className="text-zinc-300">CPU</span>{" "}
        <span className={`font-semibold ${cpuColor}`}>{Math.round(cpu * 100)}%</span>
      </span>
      <span className="text-zinc-400">|</span>
      <span className="flex items-center gap-1.5" title="Estimated memory">
        <span className="text-zinc-300">MEM</span>{" "}
        <span className="text-zinc-100">{mem > 1024 ? `${(mem / 1024).toFixed(1)}kb` : `${mem}b`}</span>
      </span>
      <span className="text-zinc-400">|</span>
      <span className="flex items-center gap-1.5" title="Token count">
        <span className="text-zinc-300">TKN</span>{" "}
        <span className="text-zinc-100">{tokens}</span>
      </span>
    </div>
  );
}
