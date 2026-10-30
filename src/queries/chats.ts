"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import type { Chat } from "@/contracts/chat";
import type { ListChatsResponse } from "@/contracts/api";
import { createChat, deleteChat, listChats, updateChat } from "@/services/chats.service";
import { queryKeys } from "./keys";
import { useAuthedApi } from "./use-authed-api";

type ChatsPages = InfiniteData<ListChatsResponse>;

export function useChats(q?: string) {
  const withAuth = useAuthedApi();

  return useInfiniteQuery({
    queryKey: q ? queryKeys.chatsSearch(q) : queryKeys.chats,
    queryFn: ({ pageParam }: { pageParam?: string }) => withAuth((token) => listChats(token, { cursor: pageParam, q })),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

function mapChats(data: ChatsPages | undefined, apply: (items: Chat[]) => Chat[]): ChatsPages | undefined {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => ({ ...page, items: apply(page.items) })) };
}

// Shared optimistic-update + rollback + invalidate shape for every chat list mutation.
function useOptimisticChatsMutation<TVars, TData>(
  mutationFn: (token: string, vars: TVars) => Promise<TData>,
  applyOptimistic: (data: ChatsPages | undefined, vars: TVars) => ChatsPages | undefined,
) {
  const withAuth = useAuthedApi();
  const queryClient: QueryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: TVars) => withAuth((token) => mutationFn(token, vars)),
    onMutate: async (vars: TVars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chats });
      const previous = queryClient.getQueryData<ChatsPages>(queryKeys.chats);
      queryClient.setQueryData(queryKeys.chats, applyOptimistic(previous, vars));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(queryKeys.chats, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.chats }),
  });
}

export function setChatTitleInCache(queryClient: QueryClient, chatId: string, title: string) {
  queryClient.setQueryData<ChatsPages>(queryKeys.chats, (data) =>
    mapChats(data, (items) => items.map((c) => (c.id === chatId ? { ...c, title } : c))),
  );
}

export function useRenameChat() {
  return useOptimisticChatsMutation(
    (token, vars: { chatId: string; title: string }) => updateChat(token, vars.chatId, { title: vars.title }),
    (data, vars) => mapChats(data, (items) => items.map((c) => (c.id === vars.chatId ? { ...c, title: vars.title } : c))),
  );
}

export function usePinChat() {
  return useOptimisticChatsMutation(
    (token, vars: { chatId: string; pinned: boolean }) => updateChat(token, vars.chatId, { pinned: vars.pinned }),
    (data, vars) => mapChats(data, (items) => items.map((c) => (c.id === vars.chatId ? { ...c, pinned: vars.pinned } : c))),
  );
}

export function useDeleteChat() {
  return useOptimisticChatsMutation(
    (token, chatId: string) => deleteChat(token, chatId),
    (data, chatId) => mapChats(data, (items) => items.filter((c) => c.id !== chatId)),
  );
}

export function useCreateChat() {
  return useOptimisticChatsMutation(
    (token, title: string | undefined) => createChat(token, { title }),
    (data, title) => {
      if (!data) return data;
      const optimisticChat: Chat = {
        id: `temp-${crypto.randomUUID()}`,
        title: title ?? "New chat",
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const [first, ...rest] = data.pages;
      if (!first) return data;
      return { ...data, pages: [{ ...first, items: [optimisticChat, ...first.items] }, ...rest] };
    },
  );
}
