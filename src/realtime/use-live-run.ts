"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeRun, useRealtimeStream } from "@trigger.dev/react-hooks";
import { useEffect, useRef } from "react";
import { RunMetadata } from "@/contracts/run";
import { queryKeys } from "@/queries/keys";
import { FINAL_STATUSES } from "@/lib/constants";
import { useLiveRunStore } from "@/stores/live-run.store";

export function useLiveRun(chatId: string) {
  const liveRun = useLiveRunStore((s) => s.runs[chatId]);
  const setMetadata = useLiveRunStore((s) => s.setMetadata);
  const setText = useLiveRunStore((s) => s.setText);
  const clear = useLiveRunStore((s) => s.clear);
  const queryClient = useQueryClient();

  const active = !!liveRun;
  const { run } = useRealtimeRun(liveRun?.runId ?? "", {
    accessToken: liveRun?.accessToken ?? "",
    enabled: active,
  });
  const { parts } = useRealtimeStream<string>(liveRun?.runId ?? "", "text", {
    accessToken: liveRun?.accessToken ?? "",
    enabled: active,
  });

  useEffect(() => {
    if (!run?.metadata) return;
    const parsed = RunMetadata.safeParse(run.metadata);
    if (!parsed.success) {
      console.warn("Ignoring run metadata with an unexpected shape", parsed.error);
      return;
    }
    setMetadata(chatId, parsed.data);
  }, [run?.metadata, chatId, setMetadata]);




  const latestParts = useRef<string[]>([]);
  const frame = useRef<number | null>(null);
  useEffect(() => {
    if (!parts) return;
    latestParts.current = parts;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setText(chatId, latestParts.current.join(""));
    });
  }, [parts, chatId, setText]);
  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);


  const finalizedRunId = useRef<string | null>(null);
  useEffect(() => {
    if (!liveRun) return;
    const terminal = FINAL_STATUSES.includes(liveRun.status) || !!run?.finishedAt;
    if (!terminal || finalizedRunId.current === liveRun.runId) return;
    finalizedRunId.current = liveRun.runId;
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) }).then(() => clear(chatId));
  }, [liveRun, run?.finishedAt, chatId, queryClient, clear]);
}
