import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("wasmoon", () => ({
  LuaMultiReturn: class extends Array {},
}));

import { registerStdlibApi } from "../lua-api/register-stdlib";
import type { ApiRegistrationContext } from "../lua-api/types";

// ── Test harness ──────────────────────────────────────────────────────────────

function makeCtx() {
  const store = new Map<string, unknown>();
  const process = vi.fn();
  const ctx = {
    L: {
      set: (k: string, v: unknown) => store.set(k, v),
      get: (k: string) => store.get(k),
    },
    process,
  } as unknown as ApiRegistrationContext;
  registerStdlibApi(ctx);
  return { store, process };
}

function get<T>(store: Map<string, unknown>, name: string) {
  return store.get(name) as T;
}

// ── tostring ─────────────────────────────────────────────────────────────────

describe("tostring()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const ts = () => get<(v: unknown) => string>(store, "tostring");

  it("null → 'nil'",       () => expect(ts()(null)).toBe("nil"));
  it("undefined → 'nil'",  () => expect(ts()(undefined)).toBe("nil"));
  it("true → 'true'",      () => expect(ts()(true)).toBe("true"));
  it("false → 'false'",    () => expect(ts()(false)).toBe("false"));
  it("number → string",    () => expect(ts()(42)).toBe("42"));
  it("string → itself",    () => expect(ts()("hello")).toBe("hello"));
  it("function → 'function: 0x000000'", () => expect(ts()(() => {})).toBe("function: 0x000000"));
  it("object → 'table: 0x000000'",      () => expect(ts()({})).toBe("table: 0x000000"));
});

// ── tonumber ─────────────────────────────────────────────────────────────────

describe("tonumber()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const tn = () => get<(v: unknown, base?: number) => unknown>(store, "tonumber");

  it("passes numbers through",                () => expect(tn()(7)).toBe(7));
  it("parses a decimal string",               () => expect(tn()("3.14")).toBeCloseTo(3.14));
  it("parses an integer string",              () => expect(tn()("10")).toBe(10));
  it("trims whitespace before parsing",       () => expect(tn()("  5  ")).toBe(5));
  it("returns undefined for non-numeric string",   () => expect(tn()("abc")).toBeUndefined());
  it("parses hex string with base 16",        () => expect(tn()("ff", 16)).toBe(255));
  it("returns undefined for null input",           () => expect(tn()(null)).toBeUndefined());
});

// ── type ─────────────────────────────────────────────────────────────────────

describe("type()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const t = () => get<(v: unknown) => string>(store, "type");

  it("nil → 'nil'",       () => expect(t()(null)).toBe("nil"));
  it("number → 'number'", () => expect(t()(1)).toBe("number"));
  it("string → 'string'", () => expect(t()("a")).toBe("string"));
  it("table → 'table'",   () => expect(t()({})).toBe("table"));
});

// ── pairs ─────────────────────────────────────────────────────────────────────

describe("pairs()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });

  it("returns [iter, table, undefined]", () => {
    const pairs = get<(t: Record<string, unknown>) => ArrayLike<unknown>>(store, "pairs");
    const obj = { a: 1 };
    const result = pairs(obj) as ArrayLike<unknown>;
    expect(typeof result[0]).toBe("function");
    expect(result[1]).toBe(obj);
    expect(result[2]).toBeUndefined();
  });

  it("iter yields all key-value pairs", () => {
    const pairs = get<(t: Record<string, unknown>) => ArrayLike<unknown>>(store, "pairs");
    const obj = { x: 10, y: 20 };
    const [iter] = pairs(obj) as [() => ArrayLike<unknown> | null];
    const results: Array<[unknown, unknown]> = [];
    let entry = iter();
    while (entry != null) {
      results.push([entry[0], entry[1]]);
      entry = iter();
    }
    expect(results).toHaveLength(2);
    expect(results).toContainEqual(["x", 10]);
    expect(results).toContainEqual(["y", 20]);
  });

  it("converts numeric string keys to numbers", () => {
    const pairs = get<(t: Record<string, unknown>) => ArrayLike<unknown>>(store, "pairs");
    const obj = { "1": "a" };
    const [iter] = pairs(obj) as [() => ArrayLike<unknown> | null];
    const entry = iter()!;
    expect(entry[0]).toBe(1);
  });

  it("iter returns undefined when exhausted", () => {
    const pairs = get<(t: Record<string, unknown>) => ArrayLike<unknown>>(store, "pairs");
    const [iter] = pairs({}) as [() => unknown];
    expect(iter()).toBeUndefined();
  });

  it("handles null/undefined table gracefully", () => {
    const pairs = get<(t: unknown) => ArrayLike<unknown>>(store, "pairs");
    expect(() => pairs(null)).not.toThrow();
  });
});

// ── ipairs ────────────────────────────────────────────────────────────────────

describe("ipairs()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });

  it("returns [iter, table, 0]", () => {
    const ipairs = get<(t: Record<number, unknown>) => ArrayLike<unknown>>(store, "ipairs");
    const obj = { 1: "a" };
    const result = ipairs(obj) as ArrayLike<unknown>;
    expect(typeof result[0]).toBe("function");
    expect(result[1]).toBe(obj);
    expect(result[2]).toBe(0);
  });

  it("iter yields 1-based index-value pairs in order", () => {
    const ipairs = get<(t: Record<number, unknown>) => ArrayLike<unknown>>(store, "ipairs");
    const [iter] = ipairs({ 1: "a", 2: "b", 3: "c" }) as [() => ArrayLike<unknown> | null];
    expect(iter()![1]).toBe("a");
    expect(iter()![1]).toBe("b");
    expect(iter()![1]).toBe("c");
    expect(iter()).toBeUndefined();
  });

  it("iter returns undefined when value is null", () => {
    const ipairs = get<(t: Record<number, unknown>) => ArrayLike<unknown>>(store, "ipairs");
    const [iter] = ipairs({ 1: null } as Record<number, unknown>) as [() => unknown];
    expect(iter()).toBeUndefined();
  });

  it("iter returns undefined when value is undefined", () => {
    const ipairs = get<(t: Record<number, unknown>) => ArrayLike<unknown>>(store, "ipairs");
    const [iter] = ipairs({} as Record<number, unknown>) as [() => unknown];
    expect(iter()).toBeUndefined();
  });
});

// ── select ────────────────────────────────────────────────────────────────────

describe("select()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const sel = () => get<(...args: unknown[]) => unknown>(store, "select");

  it("'#' returns count of remaining args", () => {
    expect(sel()("#", "a", "b", "c")).toBe(3);
  });

  it("n returns values from n-th position onward", () => {
    const result = sel()(2, "a", "b", "c") as ArrayLike<unknown>;
    expect(result[0]).toBe("b");
    expect(result[1]).toBe("c");
  });

  it("n <= 0 returns undefined", () => {
    expect(sel()(0, "a", "b")).toBeUndefined();
  });
});

// ── unpack ────────────────────────────────────────────────────────────────────

describe("unpack()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const up = () => get<(t: Record<number, unknown>, from?: number, to?: number) => ArrayLike<unknown>>(store, "unpack");

  it("unpacks the full table by default", () => {
    const r = up()({ 1: "x", 2: "y", 3: "z" });
    expect(r[0]).toBe("x");
    expect(r[1]).toBe("y");
    expect(r[2]).toBe("z");
  });

  it("respects explicit from and to", () => {
    const r = up()({ 1: "a", 2: "b", 3: "c" }, 2, 3);
    expect(r[0]).toBe("b");
    expect(r[1]).toBe("c");
    expect(r[2]).toBeUndefined();
  });
});

// ── pcall ─────────────────────────────────────────────────────────────────────

describe("pcall()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const pc = () => get<(fn: (...a: unknown[]) => unknown, ...args: unknown[]) => ArrayLike<unknown>>(store, "pcall");

  it("returns [true, result] on success", () => {
    const r = pc()(() => 42);
    expect(r[0]).toBe(true);
    expect(r[1]).toBe(42);
  });

  it("returns [false, message] on Error throw", () => {
    const r = pc()(() => { throw new Error("oops"); });
    expect(r[0]).toBe(false);
    expect(r[1]).toBe("oops");
  });

  it("returns [false, String(e)] for non-Error throw", () => {
    const r = pc()(() => { throw "raw string error"; });
    expect(r[0]).toBe(false);
    expect(r[1]).toBe("raw string error");
  });

  it("passes args to the function", () => {
    const fn = vi.fn().mockReturnValue("ok");
    pc()(fn, "arg1", "arg2");
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });
});

// ── error ─────────────────────────────────────────────────────────────────────

describe("error()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const err = () => get<(msg: unknown) => never>(store, "error");

  it("throws an Error with the given message", () => {
    expect(() => err()("something went wrong")).toThrow("something went wrong");
  });

  it("uses 'error' as fallback when msg is null", () => {
    expect(() => err()(null)).toThrow("error");
  });

  it("uses 'error' as fallback when msg is undefined", () => {
    expect(() => err()(undefined)).toThrow("error");
  });
});

// ── assert ────────────────────────────────────────────────────────────────────

describe("assert()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const assert = () => get<(...args: unknown[]) => ArrayLike<unknown>>(store, "assert");

  it("returns all args when value is truthy", () => {
    const r = assert()(true, "ignored");
    expect(r[0]).toBe(true);
  });

  it("throws 'assertion failed!' when value is false", () => {
    expect(() => assert()(false)).toThrow("assertion failed!");
  });

  it("throws 'assertion failed!' when value is null", () => {
    expect(() => assert()(null)).toThrow("assertion failed!");
  });

  it("throws the provided string message", () => {
    expect(() => assert()(false, "custom error")).toThrow("custom error");
  });

  it("throws 'assertion failed!' when message is non-string", () => {
    expect(() => assert()(false, 42)).toThrow("assertion failed!");
  });
});

// ── rawget / rawset ───────────────────────────────────────────────────────────

describe("rawget()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });

  it("returns the value at the key", () => {
    const rawget = get<(t: Record<string, unknown>, k: string) => unknown>(store, "rawget");
    expect(rawget({ a: 99 }, "a")).toBe(99);
  });

  it("returns undefined for missing keys", () => {
    const rawget = get<(t: Record<string, unknown>, k: string) => unknown>(store, "rawget");
    expect(rawget({}, "missing")).toBeUndefined();
  });
});

describe("rawset()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });

  it("sets the value and returns the table", () => {
    const rawset = get<(t: Record<string, unknown>, k: string, v: unknown) => Record<string, unknown>>(store, "rawset");
    const t: Record<string, unknown> = {};
    const result = rawset(t, "x", 7);
    expect(t.x).toBe(7);
    expect(result).toBe(t);
  });
});

// ── setmetatable / getmetatable ───────────────────────────────────────────────

describe("setmetatable() / getmetatable()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });

  it("stores and retrieves the metatable", () => {
    const setmt = get<(t: object, mt: unknown) => object>(store, "setmetatable");
    const getmt = get<(t: object) => unknown>(store, "getmetatable");
    const t = {};
    const mt = { __index: {} };
    setmt(t, mt);
    expect(getmt(t)).toBe(mt);
  });

  it("removing the metatable makes getmetatable return undefined", () => {
    const setmt = get<(t: object, mt: unknown) => object>(store, "setmetatable");
    const getmt = get<(t: object) => unknown>(store, "getmetatable");
    const t = {};
    setmt(t, { __index: {} });
    setmt(t, null);
    expect(getmt(t)).toBeUndefined();
  });

  it("getmetatable returns undefined for a table with no metatable set", () => {
    const getmt = get<(t: object) => unknown>(store, "getmetatable");
    expect(getmt({})).toBeUndefined();
  });

  it("setmetatable returns the original table", () => {
    const setmt = get<(t: object, mt: unknown) => object>(store, "setmetatable");
    const t = {};
    expect(setmt(t, {})).toBe(t);
  });
});

// ── collectgarbage ────────────────────────────────────────────────────────────

describe("collectgarbage()", () => {
  it("always returns 0 (stub)", () => {
    const { store } = makeCtx();
    const cg = get<(opt?: string) => number>(store, "collectgarbage");
    expect(cg("count")).toBe(0);
    expect(cg()).toBe(0);
  });
});

// ── table.insert ──────────────────────────────────────────────────────────────

describe("table.insert()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const tbl = () => get<Record<string, ((...a: unknown[]) => unknown)>>(store, "table");

  it("appends to end when no position given", () => {
    const t: Record<number, unknown> = { 1: "a", 2: "b" };
    tbl().insert(t, "c");
    expect(t[3]).toBe("c");
  });

  it("inserts at position, shifting existing elements", () => {
    const t: Record<number, unknown> = { 1: "a", 2: "b", 3: "c" };
    tbl().insert(t, 2, "X");
    expect(t[1]).toBe("a");
    expect(t[2]).toBe("X");
    expect(t[3]).toBe("b");
    expect(t[4]).toBe("c");
  });
});

// ── table.remove ─────────────────────────────────────────────────────────────

describe("table.remove()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const tbl = () => get<Record<string, (...a: unknown[]) => unknown>>(store, "table");

  it("removes and returns the last element by default", () => {
    const t: Record<number, unknown> = { 1: "a", 2: "b", 3: "c" };
    expect(tbl().remove(t)).toBe("c");
    expect(t[3]).toBeUndefined();
  });

  it("removes element at given position and shifts", () => {
    const t: Record<number, unknown> = { 1: "a", 2: "b", 3: "c" };
    expect(tbl().remove(t, 2)).toBe("b");
    expect(t[1]).toBe("a");
    expect(t[2]).toBe("c");
    expect(t[3]).toBeUndefined();
  });
});

// ── table.sort ────────────────────────────────────────────────────────────────

describe("table.sort()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const tbl = () => get<Record<string, (...a: unknown[]) => unknown>>(store, "table");

  it("sorts in-place with default numeric comparator", () => {
    const t: Record<number, unknown> = { 1: 3, 2: 1, 3: 2 };
    tbl().sort(t);
    expect([t[1], t[2], t[3]]).toEqual([1, 2, 3]);
  });

  it("sorts with a custom comparator", () => {
    const t: Record<number, unknown> = { 1: 1, 2: 3, 3: 2 };
    tbl().sort(t, (a: unknown, b: unknown) => (a as number) > (b as number)); // descending
    expect([t[1], t[2], t[3]]).toEqual([3, 2, 1]);
  });
});

// ── table.concat ─────────────────────────────────────────────────────────────

describe("table.concat()", () => {
  let store: Map<string, unknown>;
  beforeEach(() => { store = makeCtx().store; });
  const tbl = () => get<Record<string, (...a: unknown[]) => unknown>>(store, "table");

  it("concatenates with empty separator by default", () => {
    const t: Record<number, unknown> = { 1: "a", 2: "b", 3: "c" };
    expect(tbl().concat(t)).toBe("abc");
  });

  it("concatenates with custom separator", () => {
    const t: Record<number, unknown> = { 1: "a", 2: "b", 3: "c" };
    expect(tbl().concat(t, "-")).toBe("a-b-c");
  });

  it("respects from and to bounds", () => {
    const t: Record<number, unknown> = { 1: "a", 2: "b", 3: "c", 4: "d" };
    expect(tbl().concat(t, ",", 2, 3)).toBe("b,c");
  });
});
