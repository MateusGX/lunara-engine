import {
  PencilIcon,
  PaintBucketIcon,
  EraserIcon,
  EyedropperIcon,
  LineSegmentIcon,
} from "@phosphor-icons/react";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SpriteTool } from "@/types/editor";

const TOOLS: { id: SpriteTool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { id: "pencil", icon: PencilIcon, label: "Pencil", shortcut: "P" },
  { id: "eraser", icon: EraserIcon, label: "Eraser", shortcut: "E" },
  { id: "fill", icon: PaintBucketIcon, label: "Fill", shortcut: "F" },
  { id: "line", icon: LineSegmentIcon, label: "Line", shortcut: "L" },
  { id: "eyedropper", icon: EyedropperIcon, label: "Eyedropper", shortcut: "I" },
];

export function SpriteTools() {
  const { spriteTool, setSpriteTool } = useStore();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-rpg-gold/70">
        Tools
      </span>
      <div className="flex gap-1">
        {TOOLS.map(({ id, icon: Icon, label, shortcut }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant={spriteTool === id ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setSpriteTool(id)}
                className={spriteTool === id ? "bg-rpg-gold text-surface-base hover:bg-rpg-gold-bright" : "text-rpg-stone/60"}
              >
                <Icon size={15} weight={spriteTool === id ? "fill" : "regular"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{label}</span>
              <kbd className="ml-1.5 border border-rpg-gold/20 bg-rpg-gold/8 px-1 py-0.5 font-mono text-[10px]">
                {shortcut}
              </kbd>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
