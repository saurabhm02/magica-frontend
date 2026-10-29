"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ComposerActions, ComposerError, ComposerProvider, ComposerRoot, ComposerTextarea } from "@/components/composer/composer";
import { queryKeys } from "@/queries/keys";
import { useCancelRun } from "@/queries/messages";
import { LiveRunSync } from "@/realtime/live-run-sync";
import { useLiveRunStore } from "@/stores/live-run.store";
import { useAutoScroll } from "./use-auto-scroll";
import { useSubmitMessage } from "./use-submit-message";
import { ChatMessages } from "./chat-messages";
import { LiveBubble } from "./live-bubble";

export function ChatView({ chatId }: { chatId: string }) {
  const liveRunStatus = useLiveRunStore((s) => s.runs[chatId]?.status);
  const hasLiveRun = liveRunStatus !== undefined && liveRunStatus !== "failed" && liveRunStatus !== "cancelled";
  const stop = useLiveRunStore((s) => s.stop);
  const setStatus = useLiveRunStore((s) => s.setStatus);
  const cancelRun = useCancelRun();
  const queryClient = useQueryClient();
  const submit = useSubmitMessage(chatId);
  const { containerRef, contentRef } = useAutoScroll();

  const handleStop = async () => {
    const run = useLiveRunStore.getState().runs[chatId];
    if (!run?.runId) return;
    stop(chatId);
    try {
      await cancelRun.mutateAsync({ chatId, runId: run.runId });
      await queryClient.refetchQueries({ queryKey: queryKeys.messages(chatId) });
      useLiveRunStore.getState().clear(chatId);
    } catch {
      setStatus(chatId, run.status);
      throw new Error("Couldn't stop. Try again.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <LiveRunSync chatId={chatId} />
      <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div ref={contentRef}>
          <ChatMessages chatId={chatId} onRetry={submit} />
          <LiveBubble chatId={chatId} />
        </div>
      </div>
      <div className="px-6 pb-6">
        <ComposerProvider onSubmit={submit} onStop={handleStop} disabled={hasLiveRun}>
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
