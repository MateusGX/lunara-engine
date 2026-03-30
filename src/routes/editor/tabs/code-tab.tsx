import { useCallback } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store";
import { InlineEdit } from "../inline-edit";
import { LuaDocsDialog } from "../lua-docs-dialog";
import { CodeEditor } from "../code/code-editor";
import type { Diagnostic } from "@codemirror/lint";

export function CodeTab() {
  const {
    activeCartridge,
    updateActiveCartridge,
    selectedScriptId,
    setSelectedScriptId,
    setHasLintErrors,
  } = useStore();

  const scripts = activeCartridge?.scripts ?? [];

  const handleChange = useCallback(
    (value: string) => {
      if (!activeCartridge) return;
      updateActiveCartridge({
        scripts: activeCartridge.scripts.map((s) =>
          s.id === selectedScriptId ? { ...s, code: value } : s,
        ),
      });
    },
    [activeCartridge, selectedScriptId, updateActiveCartridge],
  );

  const handleDiagnosticsChange = (diagnostics: Diagnostic[]) => {
    setHasLintErrors(diagnostics.some((d) => d.severity === "error"));
  };

  if (!activeCartridge) return null;
  const activeScript =
    scripts.find((s) => s.id === selectedScriptId) ?? scripts[0];

  function addScript() {
    if (!activeCartridge) return;
    const newId = activeCartridge.scripts.length;
    const newScripts = [
      ...activeCartridge.scripts,
      { id: newId, name: `script_${newId}`, code: `-- script_${newId}\n` },
    ];
    updateActiveCartridge({ scripts: newScripts });
    setSelectedScriptId(newId);
  }

  function deleteScript(id: number) {
    if (!activeCartridge || scripts.length <= 1) return;
    const newScripts = scripts
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, id: i }));
    updateActiveCartridge({ scripts: newScripts });
    if (selectedScriptId >= newScripts.length)
      setSelectedScriptId(newScripts.length - 1);
    else if (selectedScriptId === id) setSelectedScriptId(Math.max(0, id - 1));
  }

  function commitRename(id: number, name: string) {
    if (!activeCartridge) return;
    updateActiveCartridge({
      scripts: scripts.map((s) =>
        s.id === id ? { ...s, name: name.trim() || `script_${id}` } : s,
      ),
    });
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Script list */}
      <div className="flex w-44 shrink-0 flex-col border-r border-white/8">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-300">
            Scripts
          </span>
          <div className="flex items-center gap-0.5">
            <LuaDocsDialog />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={addScript}
              className="text-zinc-400 hover:text-zinc-300"
              title="Add script"
            >
              <PlusIcon size={10} />
            </Button>
          </div>
        </div>

        <Separator className="bg-white/8" />

        <ScrollArea className="flex-1">
          <div className="flex w-44 flex-col gap-px overflow-x-hidden p-1.5">
            {scripts.map((s) => {
              const active = s.id === (activeScript?.id ?? 0);
              return (
                <div
                  key={s.id}
                  className={`group relative flex items-center gap-1 border px-1.5 py-1 transition ${
                    active
                      ? "border-violet-500/40 bg-violet-600/10"
                      : "border-transparent hover:border-white/8 hover:bg-white/4"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-violet-500" />
                  )}

                  <button
                    className={`shrink-0 font-mono text-[9px] ${
                      active ? "text-violet-400" : "text-zinc-400"
                    }`}
                    onClick={() => setSelectedScriptId(s.id)}
                  >
                    #{s.id}
                  </button>

                  <div
                    className="flex min-w-0 flex-1 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedScriptId(s.id)}
                  >
                    <InlineEdit
                      value={s.name}
                      onCommit={(name) => commitRename(s.id, name)}
                      emptyLabel={`script_${s.id}`}
                      className={`text-xs ${active ? "text-zinc-200" : "text-zinc-300"}`}
                      onDelete={() => {
                        deleteScript(s.id);
                      }}
                      disableDelete={scripts.length <= 1}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Separator className="bg-white/8" />

        <div className="shrink-0 px-3 py-2">
          <p className="text-[9px] leading-relaxed text-zinc-400">
            Script <span className="text-zinc-400">#0</span> runs as entry
            point.
            <br />
            Others load via{" "}
            <span className="font-mono text-zinc-400">require("name")</span>.
          </p>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeScript && (
          <CodeEditor
            key={activeScript.id}
            value={activeScript.code}
            onChange={handleChange}
            scripts={scripts}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              autocompletion: false,
            }}
            onDiagnosticsChange={handleDiagnosticsChange}
            style={{ height: "100%", fontSize: "13px" }}
          />
        )}
      </div>
    </div>
  );
}
