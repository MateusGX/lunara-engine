import { useRef, useEffect, useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface InlineEditProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  /** Extra className applied to the display span */
  className?: string;
}

export function InlineEdit({
  value,
  onCommit,
  placeholder = "name…",
  emptyLabel = "unnamed",
  className = "",
}: InlineEditProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, value]);

  function commit() {
    onCommit(draft);
    setOpen(false);
  }

  function cancel() {
    setOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
      <span className={`min-w-0 flex-1 truncate ${value ? "" : "text-zinc-700"} ${className}`}>
        {value || emptyLabel}
      </span>

      <Popover open={open} onOpenChange={(o) => { if (!o) cancel(); }}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="shrink-0 flex h-4 w-4 items-center justify-center text-zinc-600 opacity-0 transition hover:text-zinc-300 group-hover:opacity-100"
          >
            <PencilSimpleIcon size={10} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 border-white/10 bg-zinc-900 p-2 shadow-xl"
          side="right"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commit(); }
              if (e.key === "Escape") { e.preventDefault(); cancel(); }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder={placeholder}
            className="h-7 border-white/20 bg-zinc-800 text-xs text-white placeholder-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
