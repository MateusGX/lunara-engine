import { api } from "../lua-api-costs";
import type { ApiRegistrationContext } from "./types";

export function registerInputApi(ctx: ApiRegistrationContext): void {
  const { L, process, input: i } = ctx;

  L.set(api.btn.label, (idx: number) => {
    process(api.btn.cost());
    return i.btn(idx);
  });
  L.set(api.btnp.label, (idx: number) => {
    process(api.btnp.cost());
    return i.btnp(idx);
  });
}
