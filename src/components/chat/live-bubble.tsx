"use client";

import { StepList } from "@/components/tools/step-list";
import type { StepItem } from "@/lib/types";
import { useLiveRunStore } from "@/stores/live-run.store";
import { AssistantText } from "./chat-messages";
import { MediaAsset } from "./media-asset";

export function LiveBubble({ chatId }: { chatId: string }) {
  const liveRun = useLiveRunStore((s) => s.runs[chatId]);
  if (!liveRun) return null;

  const steps: StepItem[] = (liveRun.tools || []).map((t) => ({
    id: t.id,
    name: t.name,
    renderKey: t.renderKey,
    status: t.status,
    startedAt: t.startedAt,
    finishedAt: t.finishedAt,
    label: t.label,
    doneLabel: t.doneLabel,
    detail: t.detail,
    fields: t.fields,
    credits: t.credits,
    model: t.model,
  }));

  const hasAssets = !!liveRun.assets && liveRun.assets.length > 0;
  const hasText = !!liveRun.text;

  if (liveRun.status === "failed") {
    return (
      <div className="px-6 py-3" aria-live="polite">
        <p className="text-sm text-error">{liveRun.error?.message || "Failed"}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-3" aria-live="polite">
      <div className="flex flex-col items-start gap-3">
        {liveRun.isReconnecting && (
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Reconnecting…</span>
          </div>
        )}

        <StepList
          steps={steps}
          isLive={true}
          status={liveRun.status}
          thinkingStartedAt={liveRun.thinkingStartedAt}
        />

        {hasText && (
          <AssistantText text={liveRun.text} cursor={liveRun.status === "working"} />
        )}

        {hasAssets && (
          <div className="flex flex-col gap-2 w-full max-w-[460px]">
            {liveRun.assets!.map((asset, i) => (
              <MediaAsset key={asset.url || i} asset={asset} />
            ))}
          </div>
        )}

        {liveRun.status === "cancelled" && (
          <p className="text-sm text-text-secondary">Stopped</p>
        )}
      </div>
    </div>
  );
}
