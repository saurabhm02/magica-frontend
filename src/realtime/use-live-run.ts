"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeRun, useRealtimeStream } from "@trigger.dev/react-hooks";
import { useEffect, useRef } from "react";
import { RunMetadata } from "@/contracts/run";
import { queryKeys } from "@/queries/keys";
import { FINAL_STATUSES, TEXT_STREAM_ID } from "@/lib/constants";
import { useLiveRunStore } from "@/stores/live-run.store";

export function useLiveRun(chatId: string) {
  const liveRun = useLiveRunStore((s) => s.runs[chatId]);
  const setMetadata = useLiveRunStore((s) => s.setMetadata);
  const setText = useLiveRunStore((s) => s.setText);
  const clear = useLiveRunStore((s) => s.clear);
  const queryClient = useQueryClient();

  const runId = liveRun?.triggerRunId ?? "";
  const options = { id: runId, accessToken: liveRun?.accessToken ?? "", enabled: !!runId };
  const { run } = useRealtimeRun(runId, options);
  const { parts } = useRealtimeStream<string>(runId, TEXT_STREAM_ID, options);

  useEffect(() => {
    if (!run?.metadata) return;
    const parsed = RunMetadata.safeParse(run.metadata);
    if (!parsed.success) {
      console.warn("Ignoring run metadata with an unexpected shape", parsed.error);
      return;
    }
    setMetadata(chatId, parsed.data);
  }, [run?.metadata, chatId, setMetadata]);

  useEffect(() => {
    if (parts.length) setText(chatId, parts.join(""));
  }, [parts, chatId, setText]);

  const finalizedRunId = useRef<string | null>(null);
  useEffect(() => {
    if (!liveRun?.triggerRunId) return;
    const terminal = FINAL_STATUSES.includes(liveRun.status) || !!run?.finishedAt;
    if (!terminal || finalizedRunId.current === liveRun.triggerRunId) return;
    finalizedRunId.current = liveRun.triggerRunId;
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) }).then(() => clear(chatId));
  }, [liveRun, run?.finishedAt, chatId, queryClient, clear]);
}
