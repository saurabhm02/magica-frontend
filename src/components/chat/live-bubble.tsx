"use client";

import { useEffect, useState } from "react";
import { useLiveRunStore } from "@/stores/live-run.store";

export function LiveBubble({ chatId }: { chatId: string }) {
  const liveRun = useLiveRunStore((s) => s.runs[chatId]);
  if (!liveRun) return null;

  const thinking = liveRun.status === "queued" || liveRun.status === "thinking";

  return (
    <div className="flex flex-col gap-1 px-6 py-3" aria-live="polite">
      <p className="text-xs text-text-tertiary">assistant</p>
      {thinking ? (
        <ThinkingTimer startedAt={liveRun.thinkingStartedAt} />
      ) : (
        <p className="text-sm whitespace-pre-wrap text-text-primary">
          {liveRun.text}
          {liveRun.status === "working" && <span className="animate-pulse">▍</span>}
        </p>
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
