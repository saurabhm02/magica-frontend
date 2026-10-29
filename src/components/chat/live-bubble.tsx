"use client";

import { StepList } from "@/components/tools/step-list";
import { useLiveRunStore } from "@/stores/live-run.store";
import { AssistantText } from "./assistant-text";
import { InterruptedCard } from "./interrupted-card";
import { MediaAssetList } from "./media-asset-list";

export function LiveBubble({ chatId }: { chatId: string }) {
  const liveRun = useLiveRunStore((s) => s.runs[chatId]);
  if (!liveRun) return null;

  if (liveRun.status === "failed") {
    return (
      <div className="px-6 py-3">
        <p aria-live="polite" className="text-sm text-error">
          {liveRun.error?.message || "Failed"}
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-3">
      <div className="flex flex-col items-start gap-3">
        {liveRun.isReconnecting && (
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Reconnecting…</span>
          </div>
        )}

        <StepList
          steps={liveRun.tools ?? []}
          isLive={true}
          status={liveRun.status}
          thinkingStartedAt={liveRun.thinkingStartedAt}
        />

        <AssistantText text={liveRun.text} cursor={liveRun.status === "working"} />

        <MediaAssetList assets={liveRun.assets ?? []} />

        {liveRun.status === "cancelled" && <InterruptedCard />}
      </div>
    </div>
  );
}
