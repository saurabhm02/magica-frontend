"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCreateChat } from "@/queries/chats";
import { insertOptimisticUserMessage, useSendMessage } from "@/queries/messages";
import { useLiveRunStore } from "@/stores/live-run.store";

// On "/" (chatId undefined) this creates the chat first, then sends, then navigates —
// the live run is started in the store before navigating, so it keeps going across it.
export function useSubmitMessage(chatId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createChat = useCreateChat();
  const sendMessage = useSendMessage();
  const startLiveRun = useLiveRunStore((s) => s.start);

  return async (content: string) => {
    const targetChatId = chatId ?? (await createChat.mutateAsync(undefined)).id;

    insertOptimisticUserMessage(queryClient, targetChatId, content);
    const result = await sendMessage.mutateAsync({ chatId: targetChatId, content, planMode: false });
    startLiveRun(targetChatId, { runId: result.runId, accessToken: result.realtime.accessToken });

    if (!chatId) router.push(`/chat/${targetChatId}`);
  };
}
