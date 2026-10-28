"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import type { SendMessageRequest } from "@/contracts/api";
import { listMessages, sendMessage } from "@/services/messages.service";
import { queryKeys } from "./keys";
import { useAuthedApi } from "./use-authed-api";

export function useMessages(chatId: string) {
  const withAuth = useAuthedApi();

  return useInfiniteQuery({
    queryKey: queryKeys.messages(chatId),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      withAuth((token) => listMessages(token, chatId, { cursor: pageParam })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

type SendMessageVars = Omit<SendMessageRequest, "clientRequestId">;

// Retrying the same text reuses its clientRequestId, so the server returns the same run
// instead of creating a duplicate. Different text always gets a new id.
export function useSendMessage(chatId: string) {
  const withAuth = useAuthedApi();
  const queryClient = useQueryClient();
  const lastAttempt = useRef<{ content: string; clientRequestId: string } | null>(null);

  return useMutation({
    mutationFn: (vars: SendMessageVars) => {
      const attempt =
        lastAttempt.current?.content === vars.content
          ? lastAttempt.current
          : { content: vars.content, clientRequestId: crypto.randomUUID() };
      lastAttempt.current = attempt;
      return withAuth((token) => sendMessage(token, chatId, { ...vars, clientRequestId: attempt.clientRequestId }));
    },
    onSuccess: () => {
      lastAttempt.current = null;
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    },
  });
}
