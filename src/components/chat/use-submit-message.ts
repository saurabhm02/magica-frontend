"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useCreateChat } from "@/queries/chats";
import { useSendMessage } from "@/queries/messages";
import { useLiveRunStore } from "@/stores/live-run.store";

export function useSubmitMessage(chatId?: string) {
  const router = useRouter();
  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: sendMessage } = useSendMessage();

  return useCallback(
    async (content: string, planMode = false) => {
      const { start, connect, fail, clear } = useLiveRunStore.getState();
      const targetChatId = chatId ?? (await createChat(undefined)).id;

      start(targetChatId);
      const send = sendMessage({ chatId: targetChatId, content, planMode }).then(({ runId, realtime }) =>
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
    [chatId, router, createChat, sendMessage],
  );
}
