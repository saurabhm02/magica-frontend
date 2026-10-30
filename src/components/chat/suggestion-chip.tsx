"use client";

import { useMessages } from "@/queries/messages";
import { useLiveRunStore } from "@/stores/live-run.store";
import { useSubmitMessage } from "./use-submit-message";

export function SuggestionChip({ chatId }: { chatId: string }) {
  const { data } = useMessages(chatId);
  const runActive = useLiveRunStore((s) => !!s.runs[chatId] && s.runs[chatId].status !== "failed");
  const submit = useSubmitMessage(chatId);

  const latest = data?.pages[0]?.items[0];
  const suggestion = latest?.role === "assistant" ? latest.suggestion : undefined;
  if (runActive || !suggestion) return null;

  return (
    <div className="mx-auto flex w-[900px] max-w-full items-center gap-2 pb-2 text-sm">
      <span className="shrink-0 text-text-secondary">Suggested</span>
      <button
        type="button"
        onClick={() => submit(suggestion)}
        className="truncate rounded-full border border-border-secondary px-3 py-1.5 text-text-primary transition-colors hover:bg-surface-hover"
      >
        {suggestion}
      </button>
    </div>
  );
}
