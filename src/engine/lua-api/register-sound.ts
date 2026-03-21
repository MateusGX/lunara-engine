import { api } from "../lua-api-costs";
import type { ApiRegistrationContext } from "./types";

export function registerSoundApi(ctx: ApiRegistrationContext): void {
  const { L, process, audio: a } = ctx;

  L.set(api.sfx.label, (n: number) => {
    process(api.sfx.cost());
    a.sfx(n);
  });
  L.set(api.music.label, (n: number) => {
    process(api.music.cost());
    a.music(n);
  });
}
