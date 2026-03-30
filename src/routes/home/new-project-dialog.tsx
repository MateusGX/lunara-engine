import { useState } from "react";
import {
  FileIcon,
  SmileyIcon,
  GameControllerIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEMPLATES, type Template } from "./templates";

const ICONS: Record<string, React.ElementType> = {
  File: FileIcon,
  Smiley: SmileyIcon,
  GameController: GameControllerIcon,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (template: Template, name: string, author: string) => void;
}

export function NewProjectDialog({ open, onClose, onCreate }: Props) {
  const [step, setStep] = useState<"template" | "details">("template");
  const [selected, setSelected] = useState<Template>(TEMPLATES[0]);
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");

  function handleClose() {
    setStep("template");
    setName("");
    setAuthor("");
    onClose();
  }

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(selected, name.trim(), author.trim());
    setStep("template");
    setName("");
    setAuthor("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg border-white/10 bg-surface-card text-white">
        <DialogHeader>
          <DialogTitle className="text-white">New Project</DialogTitle>
          <DialogDescription className="text-zinc-300">
            {step === "template"
              ? "Choose a template to get started"
              : "Give your project a name"}
          </DialogDescription>
        </DialogHeader>

        {step === "template" ? (
          <>
            <div className="grid gap-3 py-2">
              {TEMPLATES.map((t) => {
                const Icon = ICONS[t.icon] ?? FileIcon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`flex items-start gap-4 border p-4 text-left transition ${
                      selected.id === t.id
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-white/8 bg-white/3 text-zinc-300 hover:border-white/20 hover:bg-white/6"
                    }`}
                  >
                    <span
                      className={`mt-0.5 p-2 ${
                        selected.id === t.id
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-white/8 text-zinc-300"
                      }`}
                    >
                      <Icon size={20} weight="duotone" />
                    </span>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="mt-0.5 text-sm opacity-60">
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => setStep("details")}
              className="w-full bg-violet-600 hover:bg-violet-500"
            >
              Continue{" "}
              <ArrowRightIcon size={14} weight="bold" className="ml-1" />
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name" className="text-zinc-300">
                  Project Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="proj-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="My Awesome Game"
                  className="border-white/10 bg-white/5 text-white placeholder:text-zinc-400 focus-visible:border-violet-500 focus-visible:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-author" className="text-zinc-300">
                  Author
                </Label>
                <Input
                  id="proj-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Your name"
                  className="border-white/10 bg-white/5 text-white placeholder:text-zinc-400 focus-visible:border-violet-500 focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("template")}
                className="flex-1 border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
              >
                Create Project
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
