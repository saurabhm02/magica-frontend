"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { AssetSource, AssetType } from "@/contracts/api";
import { listAssets } from "@/services/assets.service";
import { queryKeys } from "./keys";
import { useAuthedApi } from "./use-authed-api";

export function useAssets(params?: { type?: AssetType; source?: AssetSource }, enabled = true) {
  const withAuth = useAuthedApi();

  return useInfiniteQuery({
    queryKey: queryKeys.assets(params),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      withAuth((token) => listAssets(token, { cursor: pageParam, type: params?.type, source: params?.source })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
