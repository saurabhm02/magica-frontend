"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateToolRunRequest } from "@/contracts/api";
import {
  createToolRun,
  getToolDetail,
  getToolRun,
  listTools,
  listToolRuns,
} from "@/services/tools.service";
import { queryKeys } from "./keys";
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

export function useToolRuns(name: string) {
  const withAuth = useAuthedApi();

  return useInfiniteQuery({
    queryKey: queryKeys.toolRuns(name),
    queryFn: ({ pageParam }: { pageParam?: string }) => withAuth((token) => listToolRuns(token, name, { cursor: pageParam })),
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
  });
}
