"use client";

import { ComposerActions, ComposerError, ComposerProvider, ComposerRoot, ComposerTextarea } from "@/components/composer/composer";
import { useCancelRun } from "@/queries/messages";
import { useLiveRun } from "@/realtime/use-live-run";
import { useLiveRunStore } from "@/stores/live-run.store";
import { useAutoScroll } from "./use-auto-scroll";
import { useSubmitMessage } from "./use-submit-message";
import { ChatMessages } from "./chat-messages";
import { LiveBubble } from "./live-bubble";

export function ChatView({ chatId }: { chatId: string }) {
  useLiveRun(chatId);
  const liveRun = useLiveRunStore((s) => s.runs[chatId]);
  const stop = useLiveRunStore((s) => s.stop);
  const cancelRun = useCancelRun();
  const runActive =
    !!liveRun &&
    liveRun.status !== "failed" &&
    liveRun.status !== "cancelled";
  const submit = useSubmitMessage(chatId);
  const { containerRef, contentRef } = useAutoScroll();

  const handleStop = () => {
    if (!liveRun?.runId) return;
    stop(chatId);
    cancelRun.mutate({ chatId, runId: liveRun.runId });
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div ref={contentRef}>
          <ChatMessages chatId={chatId} onRetry={submit} />
          <LiveBubble chatId={chatId} />
        </div>
      </div>
      <div className="px-6 pb-6">
        <ComposerProvider onSubmit={submit} onStop={handleStop} disabled={runActive}>
          <ComposerRoot>
            <ComposerTextarea />
            <ComposerActions />
          </ComposerRoot>
          <ComposerError />
        </ComposerProvider>
      </div>
    </div>
  );
}
