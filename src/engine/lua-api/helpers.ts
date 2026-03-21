import { LuaMultiReturn } from "wasmoon";

/** Creates a LuaMultiReturn from a list of values. */
export function mr(...vals: unknown[]): LuaMultiReturn {
  const r = new LuaMultiReturn();
  r.push(...vals);
  return r;
}

/** Returns the length of a Lua array accessed through a proxy (1-based). */
export function luaLen(t: Record<number, unknown>): number {
  let n = 0;
  while (t[n + 1] !== null && t[n + 1] !== undefined) n++;
  return n;
}

/** Best-effort Lua type name from a JS value received through the proxy. */
export function luaTypeName(v: unknown): string {
  if (v === null || v === undefined) return "nil";
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "number") return "number";
  if (typeof v === "string") return "string";
  if (typeof v === "function") return "function";
  return "table";
}
