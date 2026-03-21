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
    cpu > 80 ? "text-red-400" : cpu > 50 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="flex items-center gap-3 font-mono text-[11px]">
      <span title="CPU usage">
        CPU{" "}
        <span className={cpuColor}>{Math.round(cpu)}%</span>
      </span>
      <span className="text-zinc-700">|</span>
      <span className="text-zinc-500" title="Estimated memory">
        MEM {mem > 1024 ? `${(mem / 1024).toFixed(1)}kb` : `${mem}b`}
      </span>
      <span className="text-zinc-700">|</span>
      <span className="text-zinc-500" title="Token count">
        TKN {tokens}
      </span>
    </div>
  );
}
