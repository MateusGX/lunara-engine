import { useNavigate } from "react-router-dom";
import {
  PlayIcon,
  StopIcon,
  ExportIcon,
  EyeIcon,
  EyeSlashIcon,
  FileLockIcon,
  FileArrowUpIcon,
  CaretDownIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResourceMonitor } from "@/components/resource-monitor";
import { exportLun, exportFlat } from "@/cartridge/export";
import { useStore } from "@/store";

interface Props {
  onRun: () => void;
  onStop: () => void;
  cpu: number;
  mem: number;
}

export function EditorToolbar({ onRun, onStop, cpu, mem }: Props) {
  const navigate = useNavigate();
  const {
    hasLintErrors,
    activeCartridge,
    isRunning,
    previewVisible,
    setPreviewVisible,
  } = useStore();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-rpg-gold/15 bg-surface-raised px-3">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/studio")}
          className="h-8 gap-1.5 font-bold text-rpg-stone hover:text-rpg-parchment"
        >
          <ArrowLeftIcon size={14} /> Projects
        </Button>

        <span className="text-rpg-gold/20">◆</span>

        {activeCartridge && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-rpg-parchment">
              {activeCartridge.meta.name}
            </span>
            {activeCartridge.meta.author && (
              <span className="text-xs text-rpg-stone/70">
                by {activeCartridge.meta.author}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center */}
      <ResourceMonitor cpu={cpu} mem={mem} />

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewVisible(!previewVisible)}
              className="gap-1.5 text-rpg-stone hover:text-rpg-parchment"
            >
              {previewVisible ? (
                <EyeSlashIcon size={14} />
              ) : (
                <EyeIcon size={14} />
              )}
              Preview
            </Button>
          </TooltipTrigger>
          <TooltipContent className="border-rpg-gold/20 bg-surface-overlay text-rpg-parchment text-xs">
            {previewVisible ? "Hide preview" : "Show preview"}
          </TooltipContent>
        </Tooltip>

        {activeCartridge && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ExportIcon size={13} /> Export <CaretDownIcon size={11} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-rpg-gold/20 bg-surface-overlay text-rpg-parchment w-60"
            >
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-rpg-gold/70">
                Choose export format
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-rpg-gold/12" />
              <DropdownMenuItem
                onClick={() => exportLun(activeCartridge)}
                className="cursor-pointer gap-2.5 focus:bg-rpg-gold/8 focus:text-rpg-gold"
              >
                <FileArrowUpIcon size={14} className="text-rpg-stone/70" />
                <div>
                  <p className="text-sm text-rpg-parchment">Export Project</p>
                  <p className="text-[10px] text-rpg-stone/60">
                    Editable <span className="font-mono">.lun</span> — full
                    source
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={hasLintErrors}
                onClick={() => !hasLintErrors && exportFlat(activeCartridge)}
                className="cursor-pointer gap-2.5 focus:bg-rpg-gold/8 focus:text-rpg-gold"
              >
                <FileLockIcon size={14} className="text-rpg-gold/60" />
                <div>
                  <p className="text-sm text-rpg-parchment">Export Game</p>
                  <p className="text-[10px] text-rpg-stone/60">
                    Play-only <span className="font-mono">.png</span> —
                    cartridge image
                  </p>
                  {hasLintErrors && (
                    <p className="text-[10px] text-rpg-blood/70">
                      Fix errors before exporting
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isRunning ? (
          <Button size="sm" variant="destructive" onClick={onStop}>
            <StopIcon size={13} weight="fill" className="mr-1" /> Stop
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={hasLintErrors ? "ghost" : "emerald"}
                disabled={hasLintErrors}
                onClick={() => !hasLintErrors && onRun()}
                className={
                  hasLintErrors
                    ? "border border-rpg-blood/30 text-rpg-blood/60 cursor-not-allowed"
                    : ""
                }
              >
                <PlayIcon size={13} weight="fill" className="mr-1" /> Run
              </Button>
            </TooltipTrigger>
            {hasLintErrors && (
              <TooltipContent
                side="bottom"
                className="border-rpg-blood/30 bg-surface-overlay text-rpg-blood text-xs"
              >
                Fix errors before running
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>
    </header>
  );
}
