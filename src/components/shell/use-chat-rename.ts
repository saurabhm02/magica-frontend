"use client";

import { useState } from "react";
import type { Chat } from "@/contracts/chat";
import { useRenameChat } from "@/queries/chats";

export function useChatRename(chat: Chat) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const renameChat = useRenameChat();

  function start() {
    setTitle(chat.title);
    setEditing(true);
  }

  function save() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== chat.title) renameChat.mutate({ chatId: chat.id, title: trimmed });
    setEditing(false);
  }

  return { editing, title, setTitle, start, save, cancel: () => setEditing(false) };
}
