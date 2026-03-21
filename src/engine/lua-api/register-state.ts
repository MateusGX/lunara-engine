import { api } from "../lua-api-costs";
import type { ApiRegistrationContext } from "./types";

export function registerStateApi(ctx: ApiRegistrationContext): void {
  const { L, process, renderer: r, opts } = ctx;

  L.set(api.time.label, () => {
    process(api.time.cost());
    return opts.getTime();
  });
  L.set(api.stat.label, (idx: number) => {
    process(api.stat.cost());
    const s = opts.getStats();
    if (idx === 0) return s.cpu;
    if (idx === 1) return s.mem;
    return 0;
  });
  L.set(api.camera.label, (x: number, y: number) => {
    process(api.camera.cost());
    r.camera(x, y);
  });
  L.set(api.pal.label, (c0: number, c1: number) => {
    process(api.pal.cost());
    r.pal(c0, c1);
  });
  L.set(api.palt.label, (ct: number, t: boolean) => {
    process(api.palt.cost());
    r.palt(ct, t);
  });
}
