import { useRef, useState } from "react";
import {
  PencilSimpleIcon,
  TrashIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InlineEditProps {
  value: string;
  onCommit: (value: string) => void;
  onDelete: () => void;
  disableDelete?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
}

export function InlineEdit({
  value,
  onDelete,
  disableDelete = false,
  onCommit,
  placeholder = "name…",
  emptyLabel = "unnamed",
  className = "",
}: InlineEditProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    onCommit(draft);
    setOpen(false);
  }

  function cancel() {
    setOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
      <span
        className={`min-w-0 flex-1 truncate ${value ? "" : "text-rpg-stone/50"} ${className}`}
      >
        {value || emptyLabel}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            onClick={(e) => e.stopPropagation()}
            size="icon-xs"
            variant="ghost"
            className="shrink-0 text-rpg-stone hover:bg-rpg-gold/8 hover:text-rpg-gold"
          >
            <DotsThreeIcon size={12} weight="bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); setDraft(value); setOpen(true); }}
          >
            <PencilSimpleIcon size={12} />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={disableDelete}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <TrashIcon size={12} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={(o) => { if (!o) cancel(); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input
            ref={inputRef}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commit(); }
              if (e.key === "Escape") { e.preventDefault(); cancel(); }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder={placeholder}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
            <Button size="sm" onClick={commit}>Rename</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
