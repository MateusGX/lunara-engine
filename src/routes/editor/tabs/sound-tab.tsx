import { StepSequencer } from "../sound/step-sequencer";
import { SoundList } from "../sound/sound-list";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function SoundTab() {
  return (
    <div className="flex h-full gap-0">
      {/* Left panel: sound list */}
      <ScrollArea className="w-52 shrink-0">
        <div className="flex w-52 flex-col gap-4 overflow-x-hidden p-3">
          <SoundList />
        </div>
      </ScrollArea>

      <Separator orientation="vertical" className="bg-white/8" />

      {/* Main: sequencer */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <StepSequencer />
      </div>
    </div>
  );
}
