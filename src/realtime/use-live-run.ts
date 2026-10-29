"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeRun, useRealtimeStream } from "@trigger.dev/react-hooks";
import { useEffect, useRef } from "react";
import { RunMetadata } from "@/contracts/run";
import { queryKeys } from "@/queries/keys";
import { useActiveRun } from "@/queries/messages";
import {
  FINAL_STATUSES,
  RECONNECT_INITIAL_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  REST_POLL_INTERVAL_MS,
  TEXT_STREAM_ID,
} from "@/lib/constants";
import { useLiveRunStore } from "@/stores/live-run.store";

export function useLiveRun(chatId: string) {
  const liveRun = useLiveRunStore((s) => s.runs[chatId]);
  const connect = useLiveRunStore((s) => s.connect);
  const setMetadata = useLiveRunStore((s) => s.setMetadata);
  const setText = useLiveRunStore((s) => s.setText);
  const setReconnecting = useLiveRunStore((s) => s.setReconnecting);
  const clear = useLiveRunStore((s) => s.clear);
  const queryClient = useQueryClient();

  // Reload recovery: check active-run on mount / chat switch
  const { data: activeRun, refetch: refetchActiveRun } = useActiveRun(chatId);

  useEffect(() => {
    if (!activeRun) return;
    if (!liveRun || !liveRun.triggerRunId) {
      connect(chatId, {
        runId: activeRun.runId,
        triggerRunId: activeRun.triggerRunId,
        accessToken: activeRun.accessToken,
        status: activeRun.status,
      });
    }
  }, [activeRun, liveRun, chatId, connect]);

  const runId = liveRun?.triggerRunId ?? "";
  const options = { id: runId, accessToken: liveRun?.accessToken ?? "", enabled: !!runId };
  const { run, error: runError } = useRealtimeRun(runId, options);
  const { parts, error: streamError } = useRealtimeStream<string>(runId, TEXT_STREAM_ID, options);

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
    queryClient.invalidateQueries({ queryKey: queryKeys.credits });
    queryClient.invalidateQueries({ queryKey: queryKeys.creditLedger });
    queryClient.invalidateQueries({ queryKey: queryKeys.activeRun(chatId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) }).then(() => clear(chatId));
  }, [liveRun, run?.finishedAt, chatId, queryClient, clear]);

  // Reconnection and REST fallback on error
  const retryCount = useRef(0);
  const isError = !!(runError || streamError);

  useEffect(() => {
    if (!isError || !runId) {
      if (liveRun?.isReconnecting) {
        setReconnecting(chatId, false);
      }
      retryCount.current = 0;
      return;
    }

    setReconnecting(chatId, true);

    const delay = Math.min(
      RECONNECT_INITIAL_DELAY_MS * 2 ** retryCount.current,
      RECONNECT_MAX_DELAY_MS,
    );
    const retryTimer = setTimeout(async () => {
      retryCount.current += 1;
      const res = await refetchActiveRun();
      if (res.data) {
        connect(chatId, {
          runId: res.data.runId,
          triggerRunId: res.data.triggerRunId,
          accessToken: res.data.accessToken,
          status: res.data.status,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
        clear(chatId);
      }
    }, delay);

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    }, REST_POLL_INTERVAL_MS);

    return () => {
      clearTimeout(retryTimer);
      clearInterval(pollInterval);
    };
  }, [isError, runId, chatId, refetchActiveRun, connect, clear, queryClient, setReconnecting, liveRun?.isReconnecting]);
}
