"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getCreditBalance, getCreditLedger } from "@/services/credits.service";
import { queryKeys } from "./keys";
import { useAuthedApi } from "./use-authed-api";

export function useCredits() {
  const withAuth = useAuthedApi();

  return useQuery({
    queryKey: queryKeys.credits,
    queryFn: () => withAuth((token) => getCreditBalance(token)),
  });
}

export function useCreditLedger() {
  const withAuth = useAuthedApi();

  return useInfiniteQuery({
    queryKey: queryKeys.creditLedger,
    queryFn: ({ pageParam }: { pageParam?: string }) => withAuth((token) => getCreditLedger(token, { cursor: pageParam })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
