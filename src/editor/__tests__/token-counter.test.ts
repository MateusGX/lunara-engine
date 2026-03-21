import { describe, it, expect } from "vitest";
import { countTokens } from "../token-counter";

describe("countTokens", () => {
  it("returns 0 for empty string", () => {
    expect(countTokens("")).toBe(0);
  });

  it("returns 0 for whitespace only", () => {
    expect(countTokens("   \t\n  ")).toBe(0);
  });

  it("counts a single identifier as 1 token", () => {
    expect(countTokens("x")).toBe(1);
    expect(countTokens("myVar")).toBe(1);
    expect(countTokens("_foo123")).toBe(1);
  });

  it("counts a single number as 1 token", () => {
    expect(countTokens("42")).toBe(1);
    expect(countTokens("3.14")).toBe(1);
    expect(countTokens("0xff")).toBe(1);
  });

  it("counts Lua keywords as tokens", () => {
    expect(countTokens("if")).toBe(1);
    expect(countTokens("function")).toBe(1);
    expect(countTokens("local")).toBe(1);
    expect(countTokens("end")).toBe(1);
    expect(countTokens("return")).toBe(1);
  });

  it("counts a double-quoted string as 1 token", () => {
    expect(countTokens('"hello world"')).toBe(1);
  });

  it("counts a single-quoted string as 1 token", () => {
    expect(countTokens("'test'")).toBe(1);
  });

  it("counts a long string [[...]] as 1 token", () => {
    expect(countTokens("[[multi\nline\nstring]]")).toBe(1);
  });

  it("skips line comments (-- ...)", () => {
    expect(countTokens("-- this is a comment")).toBe(0);
    expect(countTokens("x -- comment")).toBe(1);
  });

  it("skips block comments (--[[...]])", () => {
    expect(countTokens("--[[ block comment ]]")).toBe(0);
    expect(countTokens("x --[[ comment ]] y")).toBe(2);
  });

  it("counts operators as individual tokens", () => {
    // Each operator character is a separate token
    expect(countTokens("+")).toBe(1);
    expect(countTokens("==")).toBe(2); // two chars = two tokens
    expect(countTokens("..")).toBe(2);
  });

  it("counts multiple tokens in a simple expression", () => {
    // x + 1: x(1) +(1) 1(1) = 3
    expect(countTokens("x + 1")).toBe(3);
  });

  it("counts tokens in a full function definition", () => {
    const code = "local function add(a, b)\n  return a + b\nend";
    // local(1) function(1) add(1) ((1) a(1) ,(1) b(1) )(1)
    // return(1) a(1) +(1) b(1)
    // end(1)
    // = 13 tokens
    expect(countTokens(code)).toBe(13);
  });

  it("handles escaped characters inside strings", () => {
    expect(countTokens('"he said \\"hi\\""')).toBe(1);
  });

  it("handles strings with newlines properly (does not break)", () => {
    expect(countTokens("'line1\\nline2'")).toBe(1);
  });

  it("counts tokens across multiple lines correctly", () => {
    const code = "local x = 1\nlocal y = 2";
    // local(1) x(1) =(1) 1(1) local(1) y(1) =(1) 2(1) = 8
    expect(countTokens(code)).toBe(8);
  });
});
