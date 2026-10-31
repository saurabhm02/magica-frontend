"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateToolRunRequest, ToolRunSource } from "@/contracts/api";
import {
  createToolRun,
  getToolDetail,
  getToolRun,
  listTools,
  listToolRuns,
} from "@/services/tools.service";
import { queryKeys } from "./keys";

const RUN_RECHECK_MS = 5000;
const FINISHED_STATUSES = ["succeeded", "failed", "cancelled"];

export function isFinished(status: string) {
  return FINISHED_STATUSES.includes(status);
}
import { useAuthedApi } from "./use-authed-api";

export function useTools() {
  const withAuth = useAuthedApi();

  return useQuery({
    queryKey: queryKeys.tools,
    queryFn: () => withAuth((token) => listTools(token)),
  });
}

export function useToolDetail(name: string) {
  const withAuth = useAuthedApi();

  return useQuery({
    queryKey: queryKeys.toolDetail(name),
    queryFn: () => withAuth((token) => getToolDetail(token, name)),
  });
}

export function useCreateToolRun(name: string) {
  const withAuth = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateToolRunRequest) => withAuth((token) => createToolRun(token, name, body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.toolRuns(name) }),
  });
}

export function useToolRuns(name: string, source?: ToolRunSource) {
  const withAuth = useAuthedApi();

  return useInfiniteQuery({
    queryKey: queryKeys.toolRuns(name, source),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      withAuth((token) => listToolRuns(token, name, { cursor: pageParam, source })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useToolRun(runId: string | null) {
  const withAuth = useAuthedApi();

  return useQuery({
    queryKey: queryKeys.toolRun(runId ?? ""),
    queryFn: () => withAuth((token) => getToolRun(token, runId as string)),
    enabled: !!runId,
    // Realtime is the main path. While a run is still going, re-check the saved state every
    // few seconds too, so a dropped realtime connection can't leave the page stuck on "Running".
    refetchInterval: (query) => (query.state.data && !isFinished(query.state.data.status) ? RUN_RECHECK_MS : false),
  });
}
