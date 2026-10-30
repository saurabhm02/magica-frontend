"use client";

import Link from "next/link";
import type { Chat } from "@/contracts/chat";
import { formatRelativeTime } from "@/lib/constants";
import { ChatMenu } from "@/components/shell/chat-menu";
import { useChatRename } from "@/components/shell/use-chat-rename";

export function TaskRow({ chat }: { chat: Chat }) {
  const rename = useChatRename(chat);

  return (
    <div className="flex items-center justify-between gap-3 rounded-10 px-3 py-3 hover:bg-surface-hover">
      {rename.editing ? (
        <input
          autoFocus
          value={rename.title}
          onChange={(e) => rename.setTitle(e.target.value)}
          onBlur={rename.save}
          onKeyDown={(e) => {
            if (e.key === "Enter") rename.save();
            if (e.key === "Escape") rename.cancel();
          }}
          className="min-w-0 flex-1 rounded-8 bg-surface-tertiary px-2 py-0.5 text-sm text-text-primary focus:outline-none"
        />
      ) : (
        <Link href={`/chat/${chat.id}`} className="min-w-0 flex-1 truncate text-sm text-text-primary">
          {chat.title}
        </Link>
      )}
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-text-tertiary">{formatRelativeTime(chat.updatedAt)}</span>
        <ChatMenu className="relative" chat={chat} onRename={rename.start} />
      </div>
    </div>
  );
}
