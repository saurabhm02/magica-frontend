"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/services/me.service";
import { queryKeys } from "./keys";
import { useAuthedApi } from "./use-authed-api";

export function useMe() {
  const withAuth = useAuthedApi();

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => withAuth((token) => getMe(token)),
  });
}
