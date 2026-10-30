"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useCreateChat } from "@/queries/chats";
import { useSendMessage } from "@/queries/messages";
import type { AttachmentItem } from "@/lib/types";
import { useLiveRunStore } from "@/stores/live-run.store";

/**
 * Returns the composer's submit function: creates a chat if needed, sends the message, and starts the live run.
 *
 * Input:
 * - chatId: the current chat, or undefined on the new-chat screen
 *
 * Output:
 * - submit(content, planMode?, attachments?): resolves once the send is handled
 *
 * Notes:
 * - Existing chat: waits for the send; on failure it clears the live run and rethrows.
 * - New chat: navigates to the chat right away and marks the live run failed if the send fails later.
 * - Only attachments that finished uploading (have an attachmentId) are sent.
 */
export function useSubmitMessage(chatId?: string) {
  const router = useRouter();
  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: sendMessage } = useSendMessage();

  return useCallback(
    async (content: string, planMode = false, attachments: AttachmentItem[] = []) => {
      const { start, connect, fail, clear } = useLiveRunStore.getState();
      const targetChatId = chatId ?? (await createChat(undefined)).id;
      const attachmentIds = attachments.map((item) => item.attachmentId).filter((id): id is string => !!id);

      start(targetChatId);
      const send = sendMessage({ chatId: targetChatId, content, planMode, attachmentIds, attachments }).then(
        ({ runId, realtime }) => connect(targetChatId, { runId, triggerRunId: realtime.runId, accessToken: realtime.accessToken }),
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
