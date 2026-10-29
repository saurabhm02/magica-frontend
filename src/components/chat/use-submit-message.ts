"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useCreateChat } from "@/queries/chats";
import { insertOptimisticUserMessage, useSendMessage } from "@/queries/messages";
import { useLiveRunStore } from "@/stores/live-run.store";

export function useSubmitMessage(chatId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: sendMessage } = useSendMessage();

  return useCallback(
    async (content: string) => {
      const { start, connect, fail, clear } = useLiveRunStore.getState();
      const targetChatId = chatId ?? (await createChat(undefined)).id;

      insertOptimisticUserMessage(queryClient, targetChatId, content);
      start(targetChatId);
      const send = sendMessage({ chatId: targetChatId, content, planMode: false }).then(({ runId, realtime }) =>
        connect(targetChatId, { runId, triggerRunId: realtime.runId, accessToken: realtime.accessToken }),
      );

      if (chatId) {
        await send.catch((error) => {
          clear(targetChatId);
          throw error;
        });
        return;
      }

      router.push(`/chat/${targetChatId}`);
      send.catch((error) => fail(targetChatId, error instanceof Error ? error.message : "Couldn't send the message."));
    },
    [chatId, router, queryClient, createChat, sendMessage],
  );
}
