import { extractExports } from "@/lib/preprocess-lua";
import { LUA_KEYWORDS } from "@/lib/token-counter";
import type { ScriptData } from "@/types/cartridge";
import type {
  Completion,
  CompletionContext,
  CompletionInfo,
} from "@codemirror/autocomplete";
import {
  LUA_KEYWORD_COMPLETIONS,
  LUA_STD_COMPLETIONS,
  LUA_API_COMPLETIONS,
  mkInfo,
} from "./engine-api";

// Matches: -- single-line comment
const SINGLE_COMMENT_RE = /^--(?![\[-])(.*)$/;
// Matches: --[[ block comment ]] on a single line
const BLOCK_COMMENT_INLINE_RE = /^--\[\[(.+?)\]\]$/;
// Matches: inline comment at end of a declaration line
const INLINE_COMMENT_RE = /--(?!\[)(.+)$/;

/**
 * Collects the comment text immediately preceding a declaration line,
 * or inline on the same line. Consecutive `--` lines are joined;
 * a blank line resets the accumulator.
 * Single-line `--[[ ... ]]` block comments are also captured.
 * Inline comments take precedence over preceding-line comments.
 */
function parseLocalSymbols(doc: string) {
  const seen = new Set<string>();
  const options: Completion[] = [];
  const IGNORE_FUNCTIONS = new Set(["_draw", "_init", "_update"]);

  const add = (
    name: string,
    type: "variable" | "function",
    info?: Completion["info"],
  ) => {
    if (!seen.has(name)) {
      seen.add(name);
      options.push({
        label: name,
        type,
        info,
      });
    }
  };

  /** Extracts the inline comment from a declaration line, if any. */
  function extractInlineComment(line: string): string | undefined {
    // Strip the declaration part (before any --) and grab what follows
    const m = line.match(INLINE_COMMENT_RE);
    if (!m) return undefined;
    const text = m[1].trim();
    // Ignore --[[ block openers that span multiple lines
    if (text.startsWith("[[")) return undefined;
    return text || undefined;
  }

  /**
   * Resolves the final `info` string for a declaration.
   * Inline comment wins over preceding-line comment block.
   */
  function resolveInfo(line: string, pendingLines: string[]) {
    const inline = extractInlineComment(line);
    if (inline) return mkInfo(inline);
    return pendingLines.length > 0
      ? mkInfo(pendingLines.join("\n"))
      : undefined;
  }

  const lines = doc.split("\n");
  const pendingLines: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();

    // Blank line → discard any pending comment
    if (line === "") {
      pendingLines.length = 0;
      continue;
    }

    // Single-line block comment: --[[ ... ]]
    const blockInline = line.match(BLOCK_COMMENT_INLINE_RE);
    if (blockInline) {
      pendingLines.push(blockInline[1].trim());
      continue;
    }

    // Regular single-line comment: -- text
    const singleComment = line.match(SINGLE_COMMENT_RE);
    if (singleComment) {
      pendingLines.push(singleComment[1].trim());
      continue;
    }

    // local a, b, c = ...
    const localMatch = line.match(
      /^local\s+(?!function\b)([\w,\s]+?)(?:\s*=|$)/,
    );
    if (localMatch) {
      const info = resolveInfo(line, pendingLines);
      pendingLines.length = 0;
      for (const name of localMatch[1].split(",")) {
        const trimmed = name.trim();
        if (/^\w+$/.test(trimmed)) add(trimmed, "variable", info);
      }
      continue;
    }

    // function name(...) and local function name(...)
    const fnMatch = line.match(/^(?:local\s+)?function\s+(\w+)\s*\(/);
    if (fnMatch && !IGNORE_FUNCTIONS.has(fnMatch[1])) {
      const info = resolveInfo(line, pendingLines);
      pendingLines.length = 0;
      add(fnMatch[1], "function", info);
      continue;
    }

    // top-level assignments: name = ... (not local, not keyword)
    const assignMatch = line.match(/^(\w+)\s*=(?!=)/);
    if (assignMatch && !LUA_KEYWORDS.has(assignMatch[1])) {
      const info = resolveInfo(line, pendingLines);
      pendingLines.length = 0;
      add(assignMatch[1], "variable", info);
      continue;
    }

    // Non-declaration line resets the pending comment
    pendingLines.length = 0;
  }

  return options;
}

function parseRequires(doc: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of doc.matchAll(
    /local\s+(\w+)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/g,
  )) {
    map.set(m[1], m[2]); // varname → scriptname
  }
  return map;
}

export function buildCompletions(scripts?: ScriptData[]) {
  if (!scripts) return undefined;

  return [
    function (context: CompletionContext) {
      const doc = context.state.doc.toString();

      // ── member completion: varname.‹member› ──────────────────────────────
      const dotMatch = context.matchBefore(/\w+\.\w*/);
      if (dotMatch) {
        const dotIndex = dotMatch.text.indexOf(".");
        const varName = dotMatch.text.slice(0, dotIndex);

        const requires = parseRequires(doc);
        const scriptName = requires.get(varName);
        if (scriptName) {
          const target = scripts.find((s) => s.name === scriptName);
          if (target) {
            const members = extractExports(target.code);
            if (members.length > 0) {
              return {
                // from: start of the segment after the dot (cursor over the member prefix)
                from: dotMatch.from + dotIndex + 1,
                options: members.map((m) => ({
                  label: m,
                  type: "function" as const,
                })),
              };
            }
          }
        }
        return null; // don't show generic completions after "."
      }

      // ── base completions ──────────────────────────────────────────────────
      const word = context.matchBefore(/\w*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;

      // require("name") for each available module script
      const moduleOptions: Completion[] = scripts
        .filter((s) => s.id !== 0)
        .map((s) => ({
          label: `require("${s.name}")`,
          type: "function" as const,
          info: `Import module "${s.name}"`,
        }));

      const localSymbols = parseLocalSymbols(doc);

      const staticLabels = new Set(
        [
          ...LUA_KEYWORD_COMPLETIONS,
          ...LUA_STD_COMPLETIONS,
          ...LUA_API_COMPLETIONS,
        ].map((c) => c.label),
      );

      const uniqueLocalSymbols = localSymbols.filter(
        (c) => !staticLabels.has(c.label),
      );

      return {
        from: word.from,
        validFor: /^\w*$/,
        options: [
          ...LUA_KEYWORD_COMPLETIONS,
          ...LUA_STD_COMPLETIONS,
          ...LUA_API_COMPLETIONS,
          ...moduleOptions,
          ...uniqueLocalSymbols,
        ],
      };
    },
  ];
}
