import { useState } from "react";
import {
  FileIcon,
  SmileyIcon,
  GameControllerIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  CircuitryIcon,
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
import { RpgDivider } from "@/components/rpg-ui";
import { HARDWARE_PRESETS } from "@/cartridge/hardware";
import { useCustomPresets } from "@/hooks/use-custom-presets";
import type { HardwareConfig } from "@/types/cartridge";
import { TEMPLATES, type Template } from "./templates";

const ICONS: Record<string, React.ElementType> = {
  File: FileIcon,
  Smiley: SmileyIcon,
  GameController: GameControllerIcon,
};

type Step = "template" | "hardware" | "details";

const STEPS: { key: Step; label: string }[] = [
  { key: "template", label: "Template" },
  { key: "hardware", label: "Hardware" },
  { key: "details", label: "Details" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (
    template: Template,
    name: string,
    author: string,
    hw: HardwareConfig,
  ) => void;
}

export function NewProjectDialog({ open, onClose, onCreate }: Props) {
  const [step, setStep] = useState<Step>("template");
  const [selected, setSelected] = useState<Template>(TEMPLATES[0]);
  const [selectedHwId, setSelectedHwId] = useState<string>(
    HARDWARE_PRESETS[0].id,
  );
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");

  const { presets: customPresets } = useCustomPresets();

  const allPresets = [
    ...HARDWARE_PRESETS.map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.desc,
      hw: p.hw,
      custom: false,
    })),
    ...customPresets.map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.desc,
      hw: p.hw,
      custom: true,
    })),
  ];

  const selectedHw = allPresets.find((p) => p.id === selectedHwId)?.hw;

  function handleClose() {
    setStep("template");
    setName("");
    setAuthor("");
    setSelectedHwId(HARDWARE_PRESETS[0].id);
    onClose();
  }

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(selected, name.trim(), author.trim(), selectedHw!);
    setStep("template");
    setName("");
    setAuthor("");
    setSelectedHwId(HARDWARE_PRESETS[0].id);
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            {step === "template" && "Choose a template to get started."}
            {step === "hardware" && "Choose a hardware profile for your game."}
            {step === "details" && "Give your project a name."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                  i === stepIndex
                    ? "text-rpg-gold"
                    : i < stepIndex
                      ? "text-rpg-stone"
                      : "text-rpg-stone/40"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center border font-mono text-[9px] ${
                    i < stepIndex
                      ? "border-rpg-gold/30 bg-rpg-gold/10 text-rpg-stone"
                      : i === stepIndex
                        ? "border-rpg-gold/60 bg-rpg-gold/15 text-rpg-gold"
                        : "border-rpg-gold/10 text-rpg-stone/40"
                  }`}
                >
                  {i < stepIndex ? <CheckIcon size={8} weight="bold" /> : i + 1}
                </span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-5 ${i < stepIndex ? "bg-rpg-gold/25" : "bg-rpg-gold/8"}`}
                />
              )}
            </div>
          ))}
        </div>

        <RpgDivider />

        {/* ── Template ── */}
        {step === "template" && (
          <>
            <div className="max-h-64 overflow-y-auto pr-1">
              <div className="grid gap-2 py-1">
                {TEMPLATES.map((t) => {
                  const Icon = ICONS[t.icon] ?? FileIcon;
                  const active = selected.id === t.id;
                  return (
                    <Button
                      key={t.id}
                      variant="ghost"
                      size="default"
                      onClick={() => setSelected(t)}
                      className={`h-auto w-full justify-start gap-4 border p-4 text-left whitespace-normal transition ${
                        active
                          ? "border-rpg-gold/45 bg-rpg-gold/8 text-rpg-parchment"
                          : "border-rpg-gold/12 text-rpg-stone hover:border-rpg-gold/25 hover:bg-rpg-gold/5 hover:text-rpg-parchment"
                      }`}
                    >
                      <span
                        className={`shrink-0 p-2 ${active ? "bg-rpg-gold/15 text-rpg-gold" : "bg-surface-raised text-rpg-stone"}`}
                      >
                        <Icon size={20} weight="duotone" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`font-semibold ${active ? "text-rpg-gold" : "text-rpg-parchment"}`}
                        >
                          {t.name}
                        </p>
                        <p className="mt-0.5 text-xs text-rpg-stone/70 font-normal break-normal">
                          {t.description}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
            <Button
              onClick={() => setStep("hardware")}
              className="w-full gap-1.5"
            >
              Continue <ArrowRightIcon size={14} weight="bold" />
            </Button>
          </>
        )}

        {/* ── Hardware ── */}
        {step === "hardware" && (
          <>
            <div className="max-h-72 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2 py-1">
                {allPresets.map((p) => {
                  const active = p.id === selectedHwId;
                  return (
                    <Button
                      key={p.id}
                      variant="ghost"
                      size="default"
                      onClick={() => setSelectedHwId(p.id)}
                      className={`h-auto w-full flex-col items-start gap-0 border p-0 text-left whitespace-normal transition overflow-hidden ${
                        active
                          ? "border-rpg-gold/45 bg-rpg-gold/6"
                          : "border-rpg-gold/12 hover:border-rpg-gold/25 hover:bg-rpg-gold/4"
                      }`}
                    >
                      {/* Palette strip */}
                      <div className="flex h-2 w-full overflow-hidden">
                        {p.hw.palette.slice(1).map((c, i) => (
                          <div
                            key={i}
                            className="flex-1"
                            style={{ background: c }}
                          />
                        ))}
                      </div>

                      <div className="flex w-full flex-col gap-1.5 p-3">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-semibold leading-none ${active ? "text-rpg-gold" : "text-rpg-parchment"}`}
                            >
                              {p.name}
                            </span>
                            {p.custom && (
                              <CircuitryIcon
                                size={9}
                                className="text-rpg-stone/60"
                              />
                            )}
                          </div>
                          {active && (
                            <CheckIcon
                              size={11}
                              weight="bold"
                              className="shrink-0 text-rpg-gold"
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          <span className="font-mono text-[10px] text-rpg-stone/60">
                            {p.hw.width}×{p.hw.height}
                          </span>
                          <span className="font-mono text-[10px] text-rpg-stone/60">
                            {p.hw.maxFps}fps
                          </span>
                          <span className="font-mono text-[10px] text-rpg-stone/60">
                            {p.hw.palette.length} colors
                          </span>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("template")}
                className="gap-1.5"
              >
                <ArrowLeftIcon size={13} /> Back
              </Button>
              <Button
                onClick={() => setStep("details")}
                className="flex-1 gap-1.5"
              >
                Continue <ArrowRightIcon size={14} weight="bold" />
              </Button>
            </div>
          </>
        )}

        {/* ── Details ── */}
        {step === "details" && (
          <>
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name" className="text-xs text-rpg-stone">
                  Project Name <span className="text-rpg-blood">*</span>
                </Label>
                <Input
                  id="proj-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="My Awesome Game"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-author" className="text-xs text-rpg-stone">
                  Author
                </Label>
                <Input
                  id="proj-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Your name"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("hardware")}
                className="gap-1.5"
              >
                <ArrowLeftIcon size={13} /> Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1"
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
