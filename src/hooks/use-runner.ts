import { useRef, useCallback, useState } from "react";
import { CartridgeRunner } from "@/engine";
import { useStore } from "@/store";
import type { Cartridge } from "@/types/cartridge";

export function useRunner() {
  const runnerRef = useRef<CartridgeRunner | null>(null);
  const { addMessage, setIsRunning, clearMessages } = useStore();
  const [crashMessage, setCrashMessage] = useState<string | null>(null);

  const start = useCallback(
    async (cartridge: Cartridge, canvas: HTMLCanvasElement) => {
      if (runnerRef.current?.running) {
        runnerRef.current.stop();
      }
      clearMessages();
      setCrashMessage(null);
      const runner = new CartridgeRunner({
        onPrint: (msg: string) => addMessage("log", msg),
        onError: (msg: string) => {
          addMessage("error", msg);
        },
        onCrash: (msg: string) => {
          addMessage("error", msg);
          setCrashMessage(msg);
          setIsRunning(false);
        },
        onStats: () => {},
      });
      runnerRef.current = runner;
      setIsRunning(true);
      await runner.start(cartridge, canvas);
    },
    [addMessage, setIsRunning, clearMessages]
  );

  const stop = useCallback(() => {
    runnerRef.current?.stop();
    runnerRef.current = null;
    setIsRunning(false);
    setCrashMessage(null);
  }, [setIsRunning]);

  return { start, stop, runnerRef, crashMessage };
}
