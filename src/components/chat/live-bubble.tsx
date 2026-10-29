"use client";

import { useEffect, useState } from "react";
import { AssistantText } from "./chat-messages";
import { useLiveRunStore } from "@/stores/live-run.store";

export function LiveBubble({ chatId }: { chatId: string }) {
  const liveRun = useLiveRunStore((s) => s.runs[chatId]);
  if (!liveRun) return null;

  const thinking = liveRun.status === "queued" || liveRun.status === "thinking";

  return (
    <div className="px-6 py-3" aria-live="polite">
      {thinking ? (
        <ThinkingTimer startedAt={liveRun.thinkingStartedAt} />
      ) : liveRun.status === "failed" ? (
        <p className="text-sm text-error">{liveRun.error?.message}</p>
      ) : (
        <AssistantText text={liveRun.text} cursor={liveRun.status === "working"} />
      )}
    </div>
  );
}

function ThinkingTimer({ startedAt }: { startedAt?: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <p className="text-sm text-text-secondary">Thinking… {seconds}s</p>;
}
