"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeRun, useRealtimeStream } from "@trigger.dev/react-hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { RunMetadata } from "@/contracts/run";
import { queryKeys } from "@/queries/keys";
import { setChatTitleInCache } from "@/queries/chats";
import { useActiveRun } from "@/queries/messages";
import { FINAL_STATUSES, REASONING_STREAM_ID, REST_POLL_INTERVAL_MS, TEXT_STREAM_ID } from "@/lib/constants";
import { useLiveRunStore } from "@/stores/live-run.store";


export function LiveRunSync({ chatId }: { chatId: string }) {
  const triggerRunId = useLiveRunStore((s) => s.runs[chatId]?.triggerRunId);
  const accessToken = useLiveRunStore((s) => s.runs[chatId]?.accessToken);
  const status = useLiveRunStore((s) => s.runs[chatId]?.status);
  const connect = useLiveRunStore((s) => s.connect);
  const setMetadata = useLiveRunStore((s) => s.setMetadata);
  const setText = useLiveRunStore((s) => s.setText);
  const setReconnecting = useLiveRunStore((s) => s.setReconnecting);
  const clear = useLiveRunStore((s) => s.clear);
  const queryClient = useQueryClient();

  const { data: activeRun, refetch: refetchActiveRun } = useActiveRun(chatId);

  const [isError, setIsError] = useState(false);
  const [finishedRunId, setFinishedRunId] = useState<string | null>(null);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const [lingering, setLingering] = useState<{ runId: string; accessToken: string } | null>(null);
  const finalizedRunId = useRef<string | null>(null);

  // The suggestion chip is saved to the message a few seconds after the run
  // completes, so keep listening (headlessly) until the trigger run itself
  // finishes, then refetch messages once more to pick it up.
  const onLingerFinished = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    setLingering(null);
  }, [chatId, queryClient]);

  // Reload recovery: pick the live run back up on mount / chat switch.
  useEffect(() => {
    if (!activeRun || triggerRunId) return;
    const waitpoint =
      activeRun.waitpoint && activeRun.waitpoint.status === "pending"
        ? {
            id: activeRun.waitpoint.id,
            type: activeRun.waitpoint.type,
            message: activeRun.waitpoint.message,
            questions: activeRun.waitpoint.questions,
            payload: activeRun.waitpoint.payload,
            expiresAt: activeRun.waitpoint.expiresAt,
          }
        : undefined;
    connect(chatId, {
      runId: activeRun.runId,
      triggerRunId: activeRun.triggerRunId,
      accessToken: activeRun.accessToken,
      status: activeRun.status,
      waitpoint,
    });
  }, [activeRun, triggerRunId, chatId, connect]);

  useEffect(() => {
    if (!triggerRunId || status === undefined) return;
    const terminal = FINAL_STATUSES.includes(status) || finishedRunId === triggerRunId;
    if (!terminal || finalizedRunId.current === triggerRunId) return;
    finalizedRunId.current = triggerRunId;
    setLingering({ runId: triggerRunId, accessToken: accessToken ?? "" });

    queryClient.invalidateQueries({ queryKey: queryKeys.credits });
    queryClient.invalidateQueries({ queryKey: queryKeys.creditLedger });
    queryClient.setQueryData(queryKeys.activeRun(chatId), null);
    queryClient.invalidateQueries({ queryKey: queryKeys.activeRun(chatId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) }).then(() => clear(chatId));
  }, [triggerRunId, status, finishedRunId, chatId, queryClient, clear, accessToken]);


  useEffect(() => {
    if (!isError || !triggerRunId) return;
    setReconnecting(chatId, true);
    let cancelled = false;

    const attemptReconnect = async () => {
      const res = await refetchActiveRun();
      if (cancelled) return;
      if (!res.data) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
        clear(chatId);
        return;
      }
      if (res.data.triggerRunId === finalizedRunId.current) return;
      setIsError(false);
      setReconnectNonce((n) => n + 1);
      connect(chatId, {
        runId: res.data.runId,
        triggerRunId: res.data.triggerRunId,
        accessToken: res.data.accessToken,
        status: res.data.status,
      });
    };

    attemptReconnect();
    const interval = setInterval(attemptReconnect, REST_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      setReconnecting(chatId, false);
    };
  }, [isError, triggerRunId, chatId, refetchActiveRun, connect, clear, queryClient, setReconnecting]);

  return (
    <>
      {triggerRunId && (
        <RealtimeSubscription
          key={`${triggerRunId}-${reconnectNonce}`}
          chatId={chatId}
          runId={triggerRunId}
          reconnectNonce={reconnectNonce}
          accessToken={accessToken ?? ""}
          setMetadata={setMetadata}
          setText={setText}
          setIsError={setIsError}
          setFinishedRunId={setFinishedRunId}
        />
      )}
      {lingering && <LingerSubscription key={lingering.runId} {...lingering} onFinished={onLingerFinished} />}
    </>
  );
}

function LingerSubscription({
  runId,
  accessToken,
  onFinished,
}: {
  runId: string;
  accessToken: string;
  onFinished: () => void;
}) {
  const { run } = useRealtimeRun(runId, { accessToken });

  useEffect(() => {
    if (run?.finishedAt) onFinished();
  }, [run?.finishedAt, onFinished]);

  return null;
}

function RealtimeSubscription({
  chatId,
  runId,
  reconnectNonce,
  accessToken,
  setMetadata,
  setText,
  setIsError,
  setFinishedRunId,
}: {
  chatId: string;
  runId: string;
  reconnectNonce: number;
  accessToken: string;
  setMetadata: (chatId: string, metadata: RunMetadata) => void;
  setText: (chatId: string, text: string) => void;
  setIsError: (hasError: boolean) => void;
  setFinishedRunId: (id: string) => void;
}) {
  const options = { id: `${runId}-${reconnectNonce}`, accessToken };
  const { run, error: runError } = useRealtimeRun(runId, options);
  const { parts, error: streamError } = useRealtimeStream<string>(runId, TEXT_STREAM_ID, options);
  const { parts: reasoningParts } = useRealtimeStream<string>(runId, REASONING_STREAM_ID, options);
  const setReasoning = useLiveRunStore((s) => s.setReasoning);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!run?.metadata) return;
    const parsed = RunMetadata.safeParse(run.metadata);
    if (!parsed.success) return;
    setMetadata(chatId, parsed.data);
    if (parsed.data.chatTitle) setChatTitleInCache(queryClient, chatId, parsed.data.chatTitle);
  }, [run?.metadata, chatId, setMetadata, queryClient]);

  useEffect(() => {
    if (parts.length) setText(chatId, parts.join(""));
  }, [parts, chatId, setText]);

  useEffect(() => {
    if (reasoningParts.length) setReasoning(chatId, reasoningParts.join(""));
  }, [reasoningParts, chatId, setReasoning]);

  useEffect(() => {
    setIsError(!!(runError || streamError));
  }, [runError, streamError, setIsError]);

  useEffect(() => {
    if (run?.finishedAt) setFinishedRunId(runId);
  }, [run?.finishedAt, runId, setFinishedRunId]);

  return null;
}
