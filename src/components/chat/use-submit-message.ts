"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCreateChat } from "@/queries/chats";
import { insertOptimisticUserMessage, useSendMessage } from "@/queries/messages";
import { useLiveRunStore } from "@/stores/live-run.store";


export function useSubmitMessage(chatId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createChat = useCreateChat();
  const sendMessage = useSendMessage();
  const { start, connect, fail, clear } = useLiveRunStore.getState();

  return async (content: string) => {
    const targetChatId = chatId ?? (await createChat.mutateAsync(undefined)).id;

    insertOptimisticUserMessage(queryClient, targetChatId, content);
    start(targetChatId);
    const send = sendMessage
      .mutateAsync({ chatId: targetChatId, content, planMode: false })
      .then(({ realtime }) => connect(targetChatId, { triggerRunId: realtime.runId, accessToken: realtime.accessToken }));

    if (chatId) {
      await send.catch((error) => {
        clear(targetChatId);
        throw error;
      });
      return;
    }

    router.push(`/chat/${targetChatId}`);
    send.catch((error) => fail(targetChatId, error instanceof Error ? error.message : "Couldn't send the message."));
  };
}
