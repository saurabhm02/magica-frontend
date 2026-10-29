"use client";

import { useQuery } from "@tanstack/react-query";
import type { ListLedgerQuery } from "@/contracts/api";
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

export function useCreditLedger(query?: ListLedgerQuery) {
  const withAuth = useAuthedApi();

  return useQuery({
    queryKey: [...queryKeys.creditLedger, query],
    queryFn: () => withAuth((token) => getCreditLedger(token, query)),
  });
}
