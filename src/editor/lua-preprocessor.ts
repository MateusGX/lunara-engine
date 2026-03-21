/**
 * Lunara Lua preprocessor.
 *
 * Adds an `export` keyword to Lua scripts so module authors don't have to
 * manually build a table.  Two forms are supported:
 *
 *   export function name(...)  →  function __exports.name(...)
 *   export NAME = value        →  __exports.NAME = value
 *
 * If any `export` is found the output is wrapped with:
 *   local __exports = {}  (prepended)
 *   return __exports      (appended)
 *
 * Scripts without any `export` are returned unchanged.
 */
export function preprocessLua(code: string): string {
  if (!/^\s*export\s/m.test(code)) return code;

  const body = code
    .replace(/^(\s*)export\s+function\s+(\w+)/gm, "$1function __exports.$2")
    .replace(/^(\s*)export\s+(\w+)\s*=/gm, "$1__exports.$2 =");

  return `local __exports = {}\n\n${body}\n\nreturn __exports`;
}

/** Extract exported member names from a script (supports both export syntax and M.x pattern). */
export function extractExports(code: string): string[] {
  const members = new Set<string>();

  // export function name(
  for (const m of code.matchAll(/^\s*export\s+function\s+([\w]+)\s*\(/gm)) members.add(m[1]);
  // export NAME =
  for (const m of code.matchAll(/^\s*export\s+([\w]+)\s*=/gm)) members.add(m[1]);
  // function M.name( or function M:name(
  for (const m of code.matchAll(/function\s+\w+[.:]([\w]+)\s*\(/g)) members.add(m[1]);
  // M.name =
  for (const m of code.matchAll(/\w+\.([\w]+)\s*=/g)) members.add(m[1]);

  return [...members];
}
