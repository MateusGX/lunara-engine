import { StreamLanguage } from "@codemirror/language";
import CodeMirror, {
  oneDark,
  ViewUpdate,
  type BasicSetupOptions,
} from "@uiw/react-codemirror";
import { useMemo, type CSSProperties } from "react";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { autocompletion } from "@codemirror/autocomplete";
import type { ScriptData } from "@/types/cartridge";
import { highlights } from "./highlight";
import { buildCompletions } from "./completions";
import { lintGutter, type Diagnostic } from "@codemirror/lint";
import buildLinter from "./linters";

type CodeEditorProps = {
  value?: string;
  basicSetup?: boolean | BasicSetupOptions;
  style?: CSSProperties;
  readOnly?: boolean;
  scripts?: ScriptData[];
  onChange?: (value: string, viewUpdate: ViewUpdate) => void;
  onDiagnosticsChange?: (diagnostics: Diagnostic[]) => void;
};

export function CodeEditor({
  value,
  basicSetup,
  style,
  onChange,
  readOnly,
  scripts,
  onDiagnosticsChange,
}: CodeEditorProps) {
  const extensionsLocal = useMemo(
    () => [
      StreamLanguage.define(lua),
      ...highlights,
      lintGutter(),
      ...buildLinter(onDiagnosticsChange),
      autocompletion({ override: buildCompletions(scripts) }),
    ],
    [scripts],
  );

  return (
    <CodeMirror
      value={value}
      lang="lua"
      readOnly={readOnly}
      height="100%"
      theme={oneDark}
      extensions={extensionsLocal}
      onChange={onChange}
      basicSetup={basicSetup}
      style={style}
    />
  );
}
