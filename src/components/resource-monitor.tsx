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
    () =>
      activeCartridge
        ? activeCartridge.scripts.reduce(
            (sum, s) => sum + countTokens(s.code),
            0,
          )
        : 0,
    [activeCartridge],
  );

  const cpuColor =
    cpu > 80
      ? "text-rpg-blood"
      : cpu > 50
        ? "text-yellow-400"
        : "text-rpg-emerald";

  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      <span title="CPU usage" className="flex items-center gap-1.5">
        <span className="text-rpg-stone/60">CPU</span>{" "}
        <span className={`font-semibold ${cpuColor}`}>{cpu}%</span>
      </span>
      <span className="text-rpg-gold/20">·</span>
      <span className="flex items-center gap-1.5" title="Estimated memory">
        <span className="text-rpg-stone/60">MEM</span>{" "}
        <span className="text-rpg-stone/80">
          {mem > 1024 ? `${(mem / 1024).toFixed(1)}kb` : `${mem}b`}
        </span>
      </span>
      <span className="text-rpg-gold/20">·</span>
      <span className="flex items-center gap-1.5" title="Token count">
        <span className="text-rpg-stone/60">TKN</span>{" "}
        <span className="text-rpg-stone/80">{tokens}</span>
      </span>
    </div>
  );
}
