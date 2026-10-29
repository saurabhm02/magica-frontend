"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { listAssets } from "@/services/assets.service";
import { queryKeys } from "./keys";
import { useAuthedApi } from "./use-authed-api";

export function useAssets() {
  const withAuth = useAuthedApi();

  return useInfiniteQuery({
    queryKey: queryKeys.assets,
    queryFn: ({ pageParam }: { pageParam?: string }) => withAuth((token) => listAssets(token, { cursor: pageParam })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
