// lib/lua-lint.ts
import { LUA_KEYWORDS } from "@/lib/token-counter";
import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import { linter } from "@codemirror/lint";
import { LUA_API_COMPLETIONS } from "./engine-api";

interface FunctionOccurrence {
  name: string;
  from: number;
  to: number;
}

/**
 * Finds all function declarations in a Lua document and their positions.
 * Covers:
 *   function foo()
 *   local function foo()
 *   foo = function()
 *   local foo = function()
 */
function findFunctionDeclarations(doc: string): FunctionOccurrence[] {
  const results: FunctionOccurrence[] = [];

  // function name() / local function name()
  const namedFn = /(?:local\s+)?function\s+(\w+)\s*\(/g;
  for (const m of doc.matchAll(namedFn)) {
    const name = m[1];
    const from = m.index! + m[0].indexOf(name);
    results.push({ name, from, to: from + name.length });
  }

  // name = function() / local name = function()
  const assignedFn = /(?:^|\blocal\s+)(\w+)\s*=\s*function\s*\(/gm;
  for (const m of doc.matchAll(assignedFn)) {
    const name = m[1];
    const from = m.index! + m[0].indexOf(name);
    results.push({ name, from, to: from + name.length });
  }

  return results;
}

export function luaDuplicateFunctionLinter(view: EditorView): Diagnostic[] {
  const doc = view.state.doc.toString();
  const declarations = findFunctionDeclarations(doc);

  // Group occurrences by name
  const byName = new Map<string, FunctionOccurrence[]>();
  for (const decl of declarations) {
    const list = byName.get(decl.name) ?? [];
    list.push(decl);
    byName.set(decl.name, list);
  }

  const diagnostics: Diagnostic[] = [];

  for (const [name, occurrences] of byName) {
    if (occurrences.length < 2) continue;

    // Mark every occurrence as an error and point to the others
    for (let i = 0; i < occurrences.length; i++) {
      const others = occurrences
        .filter((_, j) => j !== i)
        .map((o) => {
          const line = view.state.doc.lineAt(o.from);
          return `line ${line.number}`;
        })
        .join(", ");

      diagnostics.push({
        from: occurrences[i].from,
        to: occurrences[i].to,
        severity: "error",
        message: `Duplicate function "${name}" — also defined at ${others}.`,
      });
    }
  }

  return diagnostics;
}

/**
 * Warns when a local variable shadows a Lua keyword or known global.
 * Separate linter so you can enable/disable independently.
 */
export function luaShadowLinter(view: EditorView): Diagnostic[] {
  const doc = view.state.doc.toString();
  const diagnostics: Diagnostic[] = [];

  const localRe = /\blocal\s+(?!function\b)([\w,\s]+?)(?:\s*=|$)/gm;
  for (const m of doc.matchAll(localRe)) {
    for (const part of m[1].split(",")) {
      const name = part.trim();
      if (!name || !/^\w+$/.test(name)) continue;
      if (LUA_KEYWORDS.has(name)) {
        const from = m.index! + m[0].indexOf(name);
        diagnostics.push({
          from,
          to: from + name.length,
          severity: "error",
          message: `"${name}" shadows a Lua keyword.`,
        });
      }
    }
  }

  return diagnostics;
}

export function implicitGlobalLinter(
  knownGlobals: Set<string>,
): (view: EditorView) => Diagnostic[] {
  return (view) => {
    const doc = view.state.doc.toString();
    const clean = stripStringsAndComments(doc);
    const diagnostics: Diagnostic[] = [];

    // Collect declared locals/functions
    const declared = new Set<string>(knownGlobals);
    for (const m of clean.matchAll(
      /\blocal\s+(?!function\b)([\w,\s]+?)(?:\s*=|$)/gm,
    )) {
      for (const p of m[1].split(",")) {
        const name = p.trim();
        if (/^\w+$/.test(name)) declared.add(name);
      }
    }
    for (const m of clean.matchAll(/\bfunction\s+(\w+)\s*\(/g)) {
      declared.add(m[1]);
    }

    // Flag top-level assignments to undeclared names
    for (const m of clean.matchAll(/^([a-z_]\w*)\s*=(?!=)/gm)) {
      const name = m[1];
      if (!declared.has(name)) {
        diagnostics.push({
          from: m.index!,
          to: m.index! + name.length,
          severity: "error",
          message: `"${name}" is an implicit global. Add "local".`,
        });
      }
    }
    return diagnostics;
  };
}

/** Strips string literals and comments so we don't lint inside them. */
function stripStringsAndComments(doc: string): string {
  return doc
    .replace(/--\[\[[\s\S]*?\]\]/g, (m) => " ".repeat(m.length)) // --[[ block ]]
    .replace(/--[^\n]*/g, (m) => " ".repeat(m.length)) // -- line comment
    .replace(/"(?:[^"\\]|\\.)*"/g, (m) => " ".repeat(m.length)) // "strings"
    .replace(/'(?:[^'\\]|\\.)*'/g, (m) => " ".repeat(m.length)); // 'strings'
}

const rawLinters = [
  luaShadowLinter,
  luaDuplicateFunctionLinter,
  implicitGlobalLinter(
    new Set(LUA_API_COMPLETIONS.map((c) => c.label.replace(/\(.*/, "").trim())),
  ),
];

function buildLinters(
  fns: Array<(view: EditorView) => Diagnostic[]>,
  onDiagnosticsChange?: (d: Diagnostic[]) => void,
) {
  const buckets: Diagnostic[][] = fns.map(() => []);

  return fns.map((fn, i) =>
    linter(
      (view) => {
        const results = fn(view);
        buckets[i] = results;
        onDiagnosticsChange?.(buckets.flat());
        return results;
      },
      { delay: 400 },
    ),
  );
}

export default function build(onDiagnosticsChange?: (d: Diagnostic[]) => void) {
  return buildLinters(rawLinters, onDiagnosticsChange);
}
