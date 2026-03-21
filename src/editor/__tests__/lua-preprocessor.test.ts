import { describe, it, expect } from "vitest";
import { preprocessLua, extractExports } from "../lua-preprocessor";

describe("preprocessLua", () => {
  it("returns code unchanged when no export keyword exists", () => {
    const code = "function _init()\nend\n\nfunction _draw()\n  cls(0)\nend";
    expect(preprocessLua(code)).toBe(code);
  });

  it("wraps code with __exports table when export is present", () => {
    const code = "export function greet()\n  print('hi')\nend";
    const result = preprocessLua(code);
    expect(result).toContain("local __exports = {}");
    expect(result).toContain("return __exports");
  });

  it("transforms 'export function name(' to 'function __exports.name('", () => {
    const code = "export function greet()\nend";
    const result = preprocessLua(code);
    expect(result).toContain("function __exports.greet()");
    expect(result).not.toContain("export function");
  });

  it("transforms 'export NAME =' to '__exports.NAME ='", () => {
    const code = "export SPEED = 100";
    const result = preprocessLua(code);
    expect(result).toContain("__exports.SPEED = 100");
    expect(result).not.toContain("export SPEED");
  });

  it("handles multiple exports in one file", () => {
    const code = [
      "export function init()",
      "end",
      "export MAX = 10",
      "export function update(dt)",
      "end",
    ].join("\n");

    const result = preprocessLua(code);
    expect(result).toContain("function __exports.init()");
    expect(result).toContain("__exports.MAX = 10");
    expect(result).toContain("function __exports.update(dt)");
    expect(result.indexOf("local __exports = {}")).toBe(0);
    expect(result.endsWith("return __exports")).toBe(true);
  });

  it("preserves indentation when transforming exports", () => {
    const code = "  export function helper()\n  end";
    const result = preprocessLua(code);
    expect(result).toContain("  function __exports.helper()");
  });

  it("does not wrap if 'export' only appears mid-line (not at line start)", () => {
    const code = "local x = 1 -- export not at start\nfunction _init()\nend";
    expect(preprocessLua(code)).toBe(code);
  });
});

describe("extractExports", () => {
  it("returns empty array for code with no exports", () => {
    expect(extractExports("function foo() end")).toEqual([]);
  });

  it("extracts names from 'export function' syntax", () => {
    const code = "export function greet()\nend\nexport function farewell()\nend";
    const result = extractExports(code);
    expect(result).toContain("greet");
    expect(result).toContain("farewell");
  });

  it("extracts names from 'export NAME =' syntax", () => {
    const code = "export SPEED = 100\nexport MAX_HP = 5";
    const result = extractExports(code);
    expect(result).toContain("SPEED");
    expect(result).toContain("MAX_HP");
  });

  it("extracts names from 'function M.name(' pattern", () => {
    const code = "function M.update(dt)\nend";
    const result = extractExports(code);
    expect(result).toContain("update");
  });

  it("extracts names from 'function M:name(' method syntax", () => {
    const code = "function M:draw()\nend";
    const result = extractExports(code);
    expect(result).toContain("draw");
  });

  it("extracts names from 'M.name =' assignment pattern", () => {
    const code = "M.value = 42";
    const result = extractExports(code);
    expect(result).toContain("value");
  });

  it("returns unique names (deduplicates)", () => {
    const code = "export function foo()\nend\nM.foo = 1";
    const result = extractExports(code);
    expect(result.filter((n) => n === "foo").length).toBe(1);
  });

  it("handles mixed export styles in one file", () => {
    const code = [
      "export function init()",
      "end",
      "export COUNT = 0",
      "function M.helper()",
      "end",
    ].join("\n");

    const result = extractExports(code);
    expect(result).toContain("init");
    expect(result).toContain("COUNT");
    expect(result).toContain("helper");
  });
});
