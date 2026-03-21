import { api } from "../engine-lua-api";
import type { ApiRegistrationContext } from "./types";
import { mr, luaLen, luaTypeName } from "./helpers";

export function registerStdlibApi(ctx: ApiRegistrationContext): void {
  const { L, process } = ctx;

  // ── Standard Library — Globals ────────────────────────────────────────────

  L.set("tostring", (v: unknown) => {
    process(api.tostring.cost());
    if (v === null || v === undefined) return "nil";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") return String(v);
    if (typeof v === "string") return v;
    if (typeof v === "function") return "function: 0x000000";
    return "table: 0x000000";
  });

  L.set("tonumber", (v: unknown, base?: number) => {
    process(api.tonumber.cost());
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = base ? parseInt(v.trim(), base) : Number(v.trim());
      return isNaN(n) ? null : n;
    }
    return null;
  });

  L.set("type", (v: unknown) => {
    process(api.type.cost());
    return luaTypeName(v);
  });

  // pairs — captures keys upfront; returned closure ignores (state, ctrl) args
  // since it tracks position internally (valid per Lua generic-for semantics).
  L.set("pairs", (t: Record<string, unknown>) => {
    process(api.pairs.cost());
    const keys = Object.keys(t ?? {});
    let idx = 0;
    const iter = () => {
      if (idx >= keys.length) return null;
      const k = keys[idx++];
      const numK = Number(k);
      const key = Number.isInteger(numK) && String(numK) === k ? numK : k;
      return mr(key, t[k]);
    };
    return mr(iter, t, null);
  });

  // ipairs — iterates the array portion in order (1-based).
  L.set("ipairs", (t: Record<number, unknown>) => {
    process(api.ipairs.cost());
    let idx = 0;
    const iter = () => {
      idx++;
      const v = t[idx];
      if (v === null || v === undefined) return null;
      return mr(idx, v);
    };
    return mr(iter, t, 0);
  });

  // select("#", ...) → count; select(n, ...) → values from n-th onward.
  L.set("select", (...args: unknown[]) => {
    process(api.select.cost());
    const idx = args[0];
    if (idx === "#") return args.length - 1;
    const n = Number(idx);
    if (n > 0) return mr(...args.slice(n));
    return null;
  });

  L.set("unpack", (t: Record<number, unknown>, from = 1, to?: number) => {
    process(api.unpack.cost());
    const end = to ?? luaLen(t);
    const vals: unknown[] = [];
    for (let k = from; k <= end; k++) vals.push(t[k]);
    return mr(...vals);
  });

  L.set("pcall", (fn: (...a: unknown[]) => unknown, ...args: unknown[]) => {
    process(api.pcall.cost());
    try {
      const result = fn(...args);
      return mr(true, result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return mr(false, msg);
    }
  });

  L.set("error", (msg: unknown) => {
    process(api.error.cost());
    throw new Error(String(msg ?? "error"));
  });

  L.set("assert", (...args: unknown[]) => {
    process(api.assert.cost());
    const v = args[0];
    if (v === false || v === null || v === undefined) {
      const msg = args[1];
      throw new Error(typeof msg === "string" ? msg : "assertion failed!");
    }
    return mr(...args);
  });

  L.set("rawget", (t: Record<string | number, unknown>, k: string | number) => {
    process(api.rawget.cost());
    return t?.[k] ?? null;
  });

  L.set(
    "rawset",
    (t: Record<string | number, unknown>, k: string | number, v: unknown) => {
      process(api.rawset.cost());
      t[k] = v;
      return t;
    },
  );

  // setmetatable / getmetatable — stored on a side WeakMap; metamethods are
  // not automatically triggered by the VM (no base lib), but the table is
  // preserved so user code that reads __index etc. manually still works.
  const metatables = new WeakMap<object, unknown>();
  L.set("setmetatable", (t: object, mt: unknown) => {
    process(api.setmetatable.cost());
    if (mt === null || mt === undefined) metatables.delete(t);
    else metatables.set(t, mt);
    return t;
  });
  L.set("getmetatable", (t: object) => {
    process(api.getmetatable.cost());
    return metatables.get(t) ?? null;
  });

  // collectgarbage — no GC access without standard library; returns 0 as stub.
  L.set("collectgarbage", (_opt?: string) => 0);

  // ── Standard Library — Table ──────────────────────────────────────────────

  L.set("table", {
    insert: (t: Record<number, unknown>, posOrVal: unknown, val?: unknown) => {
      process(api["table.insert"].cost());
      const len = luaLen(t);
      if (val === undefined) {
        t[len + 1] = posOrVal;
      } else {
        const pos = posOrVal as number;
        for (let k = len; k >= pos; k--) t[k + 1] = t[k];
        t[pos] = val;
      }
    },

    remove: (t: Record<number, unknown>, pos?: number) => {
      process(api["table.remove"].cost());
      const len = luaLen(t);
      const idx = pos ?? len;
      const removed = t[idx];
      for (let k = idx; k < len; k++) t[k] = t[k + 1];
      delete t[len];
      return removed;
    },

    sort: (t: Record<number, unknown>, comp?: (a: unknown, b: unknown) => boolean) => {
      process(api["table.sort"].cost());
      const len = luaLen(t);
      const arr = Array.from({ length: len }, (_, k) => t[k + 1]);
      arr.sort(
        comp
          ? (a, b) => (comp(a, b) ? -1 : 1)
          : (a, b) => ((a as number) < (b as number) ? -1 : (a as number) > (b as number) ? 1 : 0),
      );
      arr.forEach((v, k) => { t[k + 1] = v; });
    },

    concat: (t: Record<number, unknown>, sep = "", from = 1, to?: number) => {
      process(api["table.concat"].cost());
      const end = to ?? luaLen(t);
      const parts: string[] = [];
      for (let k = from; k <= end; k++) parts.push(String(t[k]));
      return parts.join(sep);
    },
  });
}
