import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  type DecorationSet,
} from "@uiw/react-codemirror";
import { ENGINE_API_NAMES } from "./engine-api";

function createWordHighlight(regexp: RegExp, className: string) {
  const mark = Decoration.mark({ class: className });
  const decorator = new MatchDecorator({ regexp, decoration: mark });
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = decorator.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.decorations = decorator.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations },
  );
}

const exportHighlight = createWordHighlight(/\bexport\b/g, "cm-export-kw");

const engineApiHighlight = createWordHighlight(
  new RegExp(`\\b(${ENGINE_API_NAMES.join("|")})\\b`, "g"),
  "cm-engine-fn",
);

const lifecycleHighlight = createWordHighlight(
  /\b(_init|_update|_draw)\b/g,
  "cm-lifecycle-fn",
);

export const highlights = [
  exportHighlight,
  engineApiHighlight,
  lifecycleHighlight,
];
