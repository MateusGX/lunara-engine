import { describe, it, expect, vi } from "vitest";

// Mock wasmoon before importing helpers so LuaMultiReturn is replaced.
vi.mock("wasmoon", () => ({
  LuaMultiReturn: class extends Array {},
}));

import { mr, luaLen, luaTypeName } from "../helpers";

// ── mr() ─────────────────────────────────────────────────────────────────────

describe("mr()", () => {
  it("returns a LuaMultiReturn carrying all given values", () => {
    const r = mr(1, "two", null);
    expect(r[0]).toBe(1);
    expect(r[1]).toBe("two");
    expect(r[2]).toBeNull();
  });

  it("returns an empty LuaMultiReturn when called with no args", () => {
    expect(mr().length).toBe(0);
  });

  it("preserves value order", () => {
    const r = mr("a", "b", "c");
    expect([r[0], r[1], r[2]]).toEqual(["a", "b", "c"]);
  });
});

// ── luaLen() ─────────────────────────────────────────────────────────────────

describe("luaLen()", () => {
  it("returns 0 for an empty object", () => {
    expect(luaLen({})).toBe(0);
  });

  it("returns the contiguous 1-based length", () => {
    expect(luaLen({ 1: "a", 2: "b", 3: "c" })).toBe(3);
  });

  it("stops at the first gap", () => {
    expect(luaLen({ 1: "a", 3: "c" })).toBe(1);
  });

  it("treats null as end of sequence", () => {
    expect(luaLen({ 1: "a", 2: null, 3: "c" } as Record<number, unknown>)).toBe(1);
  });

  it("treats undefined as end of sequence", () => {
    expect(luaLen({ 1: "a", 2: undefined } as Record<number, unknown>)).toBe(1);
  });
});

// ── luaTypeName() ─────────────────────────────────────────────────────────────

describe("luaTypeName()", () => {
  it("returns 'nil' for null",      () => expect(luaTypeName(null)).toBe("nil"));
  it("returns 'nil' for undefined", () => expect(luaTypeName(undefined)).toBe("nil"));
  it("returns 'boolean' for true",  () => expect(luaTypeName(true)).toBe("boolean"));
  it("returns 'boolean' for false", () => expect(luaTypeName(false)).toBe("boolean"));
  it("returns 'number' for integers",  () => expect(luaTypeName(0)).toBe("number"));
  it("returns 'number' for floats",    () => expect(luaTypeName(3.14)).toBe("number"));
  it("returns 'string' for strings",   () => expect(luaTypeName("hi")).toBe("string"));
  it("returns 'function' for functions", () => expect(luaTypeName(() => {})).toBe("function"));
  it("returns 'table' for plain objects", () => expect(luaTypeName({})).toBe("table"));
  it("returns 'table' for arrays",        () => expect(luaTypeName([])).toBe("table"));
});
