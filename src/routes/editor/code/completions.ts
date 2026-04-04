import { extractExports } from "@/editor/lua-preprocessor";
import { LUA_KEYWORDS } from "@/editor/token-counter";
import type { ScriptData } from "@/types/cartridge";
import type { Completion, CompletionContext } from "@codemirror/autocomplete";
import {
  LUA_KEYWORD_COMPLETIONS,
  LUA_STD_COMPLETIONS,
  LUA_API_COMPLETIONS,
  mkInfo,
} from "./engine-api";

const SINGLE_COMMENT_RE = /^--(?![[-])(.*)$/;
const BLOCK_COMMENT_INLINE_RE = /^--\[\[(.+?)\]\]$/;
const INLINE_COMMENT_RE = /--(?!\[)(.+)$/;

const IGNORE_FUNCTIONS = new Set(["_draw", "_init", "_update"]);

const STATIC_LABELS = new Set(
  [
    ...LUA_KEYWORD_COMPLETIONS,
    ...LUA_STD_COMPLETIONS,
    ...LUA_API_COMPLETIONS,
  ].map((c) => c.label),
);

function parseLocalSymbols(doc: string): Completion[] {
  const seen = new Set<string>();
  const options: Completion[] = [];
  const pending: string[] = [];

  const add = (
    name: string,
    type: "variable" | "function",
    info?: Completion["info"],
  ) => {
    if (!seen.has(name) && !STATIC_LABELS.has(name)) {
      seen.add(name);
      options.push({ label: name, type, info });
    }
  };

  const resolveInfo = (line: string): Completion["info"] | undefined => {
    const inlineMatch = line.match(INLINE_COMMENT_RE);
    const inline =
      inlineMatch && !inlineMatch[1].trim().startsWith("[[")
        ? inlineMatch[1].trim()
        : undefined;
    const text =
      inline ?? (pending.length > 0 ? pending.join("\n") : undefined);
    return text ? mkInfo(text) : undefined;
  };

  for (const raw of doc.split("\n")) {
    const line = raw.trim();

    if (!line) {
      pending.length = 0;
      continue;
    }

    const blockInline = line.match(BLOCK_COMMENT_INLINE_RE);
    if (blockInline) {
      pending.push(blockInline[1].trim());
      continue;
    }

    const singleComment = line.match(SINGLE_COMMENT_RE);
    if (singleComment) {
      pending.push(singleComment[1].trim());
      continue;
    }

    const localMatch = line.match(
      /^local\s+(?!function\b)([\w,\s]+?)(?:\s*=|$)/,
    );
    if (localMatch) {
      const info = resolveInfo(line);
      pending.length = 0;
      localMatch[1].split(",").forEach((n) => {
        const name = n.trim();
        if (/^\w+$/.test(name)) add(name, "variable", info);
      });
      continue;
    }

    const fnMatch = line.match(/^(?:local\s+)?function\s+(\w+)\s*\(/);
    if (fnMatch && !IGNORE_FUNCTIONS.has(fnMatch[1])) {
      const info = resolveInfo(line);
      pending.length = 0;
      add(fnMatch[1], "function", info);
      continue;
    }

    const assignMatch = line.match(/^(\w+)\s*=(?!=)/);
    if (assignMatch && !LUA_KEYWORDS.has(assignMatch[1])) {
      const info = resolveInfo(line);
      pending.length = 0;
      add(assignMatch[1], "variable", info);
      continue;
    }

    pending.length = 0;
  }

  return options;
}

function parseRequires(doc: string): Map<string, string> {
  return new Map(
    [
      ...doc.matchAll(
        /local\s+(\w+)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/g,
      ),
    ].map((m) => [m[1], m[2]]),
  );
}

export function buildCompletions(scripts?: ScriptData[]) {
  if (!scripts) return undefined;

  return [
    (context: CompletionContext) => {
      const doc = context.state.doc.toString();

      const dotMatch = context.matchBefore(/\w+\.\w*/);
      if (dotMatch) {
        const dotIndex = dotMatch.text.indexOf(".");
        const varName = dotMatch.text.slice(0, dotIndex);
        const scriptName = parseRequires(doc).get(varName);
        const target = scripts.find((s) => s.name === scriptName);
        const members = target ? extractExports(target.code) : [];

        if (members.length > 0) {
          return {
            from: dotMatch.from + dotIndex + 1,
            options: members.map((m) => ({
              label: m,
              type: "function" as const,
            })),
          };
        }
        return null;
      }

      const word = context.matchBefore(/\w*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;

      const moduleOptions: Completion[] = scripts
        .filter((s) => s.id !== 0)
        .map((s) => ({
          label: `require("${s.name}")`,
          type: "function" as const,
          info: `Import module "${s.name}"`,
        }));

      return {
        from: word.from,
        validFor: /^\w*$/,
        options: [
          ...LUA_KEYWORD_COMPLETIONS,
          ...LUA_STD_COMPLETIONS,
          ...LUA_API_COMPLETIONS,
          ...moduleOptions,
          ...parseLocalSymbols(doc),
        ],
      };
    },
  ];
}
