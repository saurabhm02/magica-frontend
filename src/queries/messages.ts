"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import type { Attachment, ListMessagesResponse, RespondWaitpointInput, SendMessageRequest } from "@/contracts/api";
import type { Message } from "@/contracts/message";
import type { AttachmentItem } from "@/lib/types";
import { cancelRun, getActiveRun, listMessages, respondWaitpoint, sendMessage } from "@/services/messages.service";
import { queryKeys } from "./keys";
import { useAuthedApi } from "./use-authed-api";

// The user's message while its send request is still in flight, per chat. A new chat's
// first message list can load before the server has saved the message; without this the
// list would come back empty and the message would vanish for a few seconds.
const pendingUserMessages = new Map<string, Message>();

function keepPendingMessage(chatId: string, page: ListMessagesResponse): ListMessagesResponse {
  const pending = pendingUserMessages.get(chatId);
  if (!pending || page.items.some((m) => m.clientRequestId === pending.clientRequestId)) return page;
  return { ...page, items: [pending, ...page.items] };
}

export function useMessages(chatId: string) {
  const withAuth = useAuthedApi();

  return useInfiniteQuery({
    queryKey: queryKeys.messages(chatId),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const page = await withAuth((token) => listMessages(token, chatId, { cursor: pageParam }));
      return pageParam ? page : keepPendingMessage(chatId, page);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// The optimistic message shows the attachments as they were when the user hit send (local
// blob previews, not yet the saved CDN URLs), so pending items need an Attachment shape too.
function toOptimisticAttachment(item: AttachmentItem, position: number): Attachment {
  return {
    id: item.attachmentId ?? item.id,
    source: "upload",
    kind: item.kind,
    mimeType: "",
    sizeBytes: 0,
    name: item.name,
    url: item.url ?? item.previewUrl ?? "",
    status: "ready",
    position,
    createdAt: new Date().toISOString(),
  };
}

function insertOptimisticUserMessage(
  queryClient: QueryClient,
  chatId: string,
  content: string,
  clientRequestId: string,
  attachments: AttachmentItem[],
) {
  const optimisticMessage: Message = {
    id: `temp-${clientRequestId}`,
    chatId,
    role: "user",
    status: "complete",
    content: [{ type: "text", text: content }],
    clientRequestId,
    attachments: attachments.map(toOptimisticAttachment),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  pendingUserMessages.set(chatId, optimisticMessage);
  queryClient.setQueryData<InfiniteData<ListMessagesResponse>>(queryKeys.messages(chatId), (data) => {
    if (!data) return { pages: [{ items: [optimisticMessage], nextCursor: null }], pageParams: [undefined] };
    const [first, ...rest] = data.pages;
    if (!first || first.items.some((m) => m.clientRequestId === clientRequestId)) return data;
    return { ...data, pages: [{ ...first, items: [optimisticMessage, ...first.items] }, ...rest] };
  });
}

type SendMessageVars = Omit<SendMessageRequest, "clientRequestId"> & { chatId: string; attachments?: AttachmentItem[] };

export function useSendMessage() {
  const withAuth = useAuthedApi();
  const queryClient = useQueryClient();
  const lastAttempt = useRef<{ chatId: string; content: string; clientRequestId: string } | null>(null);

  return useMutation({
    // Runs before mutationFn: pick the request id (reused when retrying the same message)
    // and show the message right away with that id.
    onMutate: (vars: SendMessageVars) => {
      const reuse = lastAttempt.current?.chatId === vars.chatId && lastAttempt.current?.content === vars.content;
      if (!reuse) lastAttempt.current = { chatId: vars.chatId, content: vars.content, clientRequestId: crypto.randomUUID() };
      insertOptimisticUserMessage(queryClient, vars.chatId, vars.content, lastAttempt.current!.clientRequestId, vars.attachments ?? []);
    },
    mutationFn: (vars: SendMessageVars) =>
      withAuth((token) =>
        sendMessage(token, vars.chatId, {
          content: vars.content,
          attachmentIds: vars.attachmentIds,
          planMode: vars.planMode,
          model: vars.model,
          webhook: vars.webhook,
          clientRequestId: lastAttempt.current!.clientRequestId,
        }),
      ),
    onSuccess: () => {
      lastAttempt.current = null;
      queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
    onSettled: (_data, _error, vars) => {
      pendingUserMessages.delete(vars.chatId);
      return queryClient.invalidateQueries({ queryKey: queryKeys.messages(vars.chatId) });
    },
  });
}

export function useActiveRun(chatId: string) {
  const withAuth = useAuthedApi();
  return useQuery({
    queryKey: queryKeys.activeRun(chatId),
    queryFn: () => withAuth((token) => getActiveRun(token, chatId)),
    enabled: !!chatId,
  });
}

export function useRespondWaitpoint(chatId: string) {
  const withAuth = useAuthedApi();

  return useMutation({
    mutationFn: ({ waitpointId, body }: { waitpointId: string; body: RespondWaitpointInput }) =>
      withAuth((token) => respondWaitpoint(token, chatId, waitpointId, body)),
  });
}

export function useCancelRun() {
  const withAuth = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, runId }: { chatId: string; runId: string }) =>
      withAuth((token) => cancelRun(token, chatId, runId)),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(vars.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRun(vars.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.credits });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditLedger });
    },
  });
}
