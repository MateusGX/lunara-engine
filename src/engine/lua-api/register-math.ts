import { api } from "../engine-lua-api";
import type { ApiRegistrationContext } from "./types";

export function registerMathApi(ctx: ApiRegistrationContext): void {
  const { L, process } = ctx;

  L.set(api.rnd.label, (n = 1) => {
    process(api.rnd.cost());
    return Math.random() * n;
  });
  L.set(api.flr.label, (n: number) => {
    process(api.flr.cost());
    return Math.floor(n);
  });
  L.set(api.ceil.label, (n: number) => {
    process(api.ceil.cost());
    return Math.ceil(n);
  });
  L.set(api.abs.label, (n: number) => {
    process(api.abs.cost());
    return Math.abs(n);
  });
  L.set(api.min.label, (a: number, b: number) => {
    process(api.min.cost());
    return Math.min(a, b);
  });
  L.set(api.max.label, (a: number, b: number) => {
    process(api.max.cost());
    return Math.max(a, b);
  });
  L.set(api.mid.label, (a: number, b: number, c: number) => {
    process(api.mid.cost());
    return [a, b, c].sort((x, y) => x - y)[1];
  });
  L.set(api.sin.label, (a: number) => {
    process(api.sin.cost());
    return Math.sin(a);
  });
  L.set(api.cos.label, (a: number) => {
    process(api.cos.cost());
    return Math.cos(a);
  });
  L.set(api.atan2.label, (y: number, x: number) => {
    process(api.atan2.cost());
    return Math.atan2(y, x);
  });
  L.set(api.sqrt.label, (n: number) => {
    process(api.sqrt.cost());
    return Math.sqrt(n);
  });

  // pi — global constant (no cost, just a value)
  L.set("pi", Math.PI);
}
