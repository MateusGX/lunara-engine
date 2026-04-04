import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// RPG color constants (mirrors index.css tokens)
const gold        = "oklch(0.68 0.22 300)";
const goldDim     = "oklch(0.56 0.16 300)";
const goldBright  = "oklch(0.82 0.20 300)";
const parchment   = "oklch(0.92 0.04 300)";
const stone       = "oklch(0.50 0.04 300)";
const stoneMid    = "oklch(0.62 0.04 300)";
const blood       = "oklch(0.62 0.22 25)";
const emerald     = "oklch(0.65 0.18 145)";
const sky         = "oklch(0.68 0.14 220)";
const surfaceBase = "#0c0c12";

const lunaraEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: surfaceBase,
      color: parchment,
    },
    ".cm-content": {
      caretColor: gold,
      fontFamily: '"JetBrains Mono Variable", monospace',
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: gold,
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "oklch(0.68 0.22 300 / 18%)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "oklch(0.68 0.22 300 / 12%)",
    },
    ".cm-selectionMatch": {
      backgroundColor: "oklch(0.68 0.22 300 / 10%)",
    },
    ".cm-activeLine": {
      backgroundColor: "oklch(0.68 0.22 300 / 4%)",
    },
    ".cm-gutters": {
      backgroundColor: surfaceBase,
      color: stone,
      border: "none",
      borderRight: "1px solid oklch(0.68 0.22 300 / 8%)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "oklch(0.68 0.22 300 / 4%)",
      color: goldDim,
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "oklch(0.68 0.22 300 / 12%)",
      border: "1px solid oklch(0.68 0.22 300 / 20%)",
      color: goldDim,
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "oklch(0.68 0.22 300 / 15%)",
      outline: "1px solid oklch(0.68 0.22 300 / 40%)",
    },
  },
  { dark: true },
);

const lunaraHighlightStyle = HighlightStyle.define([
  { tag: t.keyword,                          color: gold,      fontWeight: "600" },
  { tag: [t.null, t.bool],                   color: goldDim },
  { tag: t.string,                           color: emerald },
  { tag: t.regexp,                           color: emerald },
  { tag: t.number,                           color: "oklch(0.72 0.15 55)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: stone, fontStyle: "italic" },
  { tag: t.operator,                         color: goldDim },
  { tag: [t.punctuation, t.bracket, t.squareBracket], color: stoneMid },
  { tag: t.definition(t.variableName),       color: goldBright, fontWeight: "600" },
  { tag: t.function(t.variableName),         color: sky },
  { tag: t.function(t.propertyName),         color: sky },
  { tag: t.variableName,                     color: parchment },
  { tag: t.propertyName,                     color: "oklch(0.78 0.08 300)" },
  { tag: t.typeName,                         color: goldDim },
  { tag: t.standard(t.name),                 color: sky },
  { tag: t.meta,                             color: stone },
  { tag: t.escape,                           color: blood },
  { tag: t.invalid,                          color: blood, textDecoration: "underline" },
]);

export const lunaraTheme = [
  lunaraEditorTheme,
  syntaxHighlighting(lunaraHighlightStyle),
];
