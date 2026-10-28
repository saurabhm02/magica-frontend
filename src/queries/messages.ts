"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import type { ListMessagesResponse, SendMessageRequest } from "@/contracts/api";
import type { Message } from "@/contracts/message";
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

export function insertOptimisticUserMessage(queryClient: QueryClient, chatId: string, content: string) {
  const optimisticMessage: Message = {
    id: `temp-${crypto.randomUUID()}`,
    chatId,
    role: "user",
    status: "complete",
    content: [{ type: "text", text: content }],
    clientRequestId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  queryClient.setQueryData<InfiniteData<ListMessagesResponse>>(queryKeys.messages(chatId), (data) => {
    if (!data) return { pages: [{ items: [optimisticMessage], nextCursor: null }], pageParams: [undefined] };
    const [first, ...rest] = data.pages;
    if (!first) return data;
    return { ...data, pages: [{ ...first, items: [optimisticMessage, ...first.items] }, ...rest] };
  });
}

type SendMessageVars = Omit<SendMessageRequest, "clientRequestId"> & { chatId: string };

export function useSendMessage() {
  const withAuth = useAuthedApi();
  const queryClient = useQueryClient();
  const lastAttempt = useRef<{ chatId: string; content: string; clientRequestId: string } | null>(null);

  return useMutation({
    mutationFn: (vars: SendMessageVars) => {
      const attempt =
        lastAttempt.current?.chatId === vars.chatId && lastAttempt.current?.content === vars.content
          ? lastAttempt.current
          : { chatId: vars.chatId, content: vars.content, clientRequestId: crypto.randomUUID() };
      lastAttempt.current = attempt;
      return withAuth((token) =>
        sendMessage(token, vars.chatId, { ...vars, clientRequestId: attempt.clientRequestId }),
      );
    },
    onSuccess: () => {
      lastAttempt.current = null;
    },
    onSettled: (_data, _error, vars) => queryClient.invalidateQueries({ queryKey: queryKeys.messages(vars.chatId) }),
  });
}
