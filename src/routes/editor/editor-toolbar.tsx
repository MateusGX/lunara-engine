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
import { Separator } from "@/components/ui/separator";
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
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/8 px-3">
      {/* Left */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-1.5 text-zinc-500 hover:text-zinc-200"
        >
          <ArrowLeftIcon size={13} /> Projects
        </Button>
        <Separator orientation="vertical" />
        {activeCartridge && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {activeCartridge.meta.name}
            </span>
            {activeCartridge.meta.author && (
              <span className="text-xs text-zinc-600">
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
              className="gap-1.5 text-zinc-500 hover:text-zinc-200"
            >
              {previewVisible ? (
                <EyeSlashIcon size={14} />
              ) : (
                <EyeIcon size={14} />
              )}
              Preview
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {previewVisible ? "Hide preview" : "Show preview"}
          </TooltipContent>
        </Tooltip>

        {activeCartridge && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-white/10 bg-transparent text-zinc-400 hover:border-white/20 hover:bg-white/5 hover:text-zinc-200"
              >
                <ExportIcon size={13} /> Export <CaretDownIcon size={11} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-white/10 bg-[#1a1a2e] text-zinc-300 w-60"
            >
              <DropdownMenuLabel className="text-[10px] font-normal text-zinc-600">
                Choose export format
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/8" />
              <DropdownMenuItem
                onClick={() => exportLun(activeCartridge)}
                className="cursor-pointer gap-2.5 focus:bg-white/8 focus:text-white"
              >
                <FileArrowUpIcon size={14} className="text-zinc-400" />
                <div>
                  <p className="text-sm">Export Project</p>
                  <p className="text-[10px] text-zinc-600">
                    Editable <span className="font-mono">.lun</span> — full
                    source
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={hasLintErrors}
                onClick={() => !hasLintErrors && exportFlat(activeCartridge)}
                className="cursor-pointer gap-2.5 focus:bg-white/8 focus:text-white"
              >
                <FileLockIcon size={14} className="text-violet-400" />
                <div>
                  <p className="text-sm">Export Game</p>
                  <p className="text-[10px] text-zinc-600">
                    Play-only <span className="font-mono">.png</span> — cartridge image
                  </p>
                  {hasLintErrors && (
                    <p className="text-[10px] text-red-400/70">
                      Fix errors before exporting
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isRunning ? (
          <Button
            size="sm"
            onClick={onStop}
            className="bg-red-600/80 hover:bg-red-600"
          >
            <StopIcon size={13} weight="fill" className="mr-1" /> Stop
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                disabled={hasLintErrors}
                onClick={() => !hasLintErrors && onRun()}
                className={
                  hasLintErrors
                    ? "cursor-not-allowed border border-red-500/30 bg-transparent text-red-400/60 hover:bg-red-500/5 hover:text-red-400"
                    : "bg-green-700 hover:bg-green-600"
                }
              >
                <PlayIcon size={13} weight="fill" className="mr-1" /> Run
              </Button>
            </TooltipTrigger>
            {hasLintErrors && (
              <TooltipContent side="bottom" className=" text-red-400">
                Fix errors before running
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>
    </header>
  );
}
