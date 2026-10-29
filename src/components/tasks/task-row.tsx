"use client";

import { MoreVertical, Pin, PinOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Chat } from "@/contracts/chat";
import { formatRelativeTime } from "@/lib/constants";
import { useClickOutside } from "@/lib/use-click-outside";
import { usePinChat, useDeleteChat } from "@/queries/chats";
import { IconButton } from "@/components/ui/icon-button";

export function TaskRow({ chat }: { chat: Chat }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, open, () => setOpen(false));
  const pinChat = usePinChat();
  const deleteChat = useDeleteChat();

  return (
    <div className="flex items-center justify-between gap-3 rounded-10 px-3 py-3 hover:bg-surface-hover">
      <Link href={`/chat/${chat.id}`} className="min-w-0 flex-1 truncate text-sm text-text-primary">
        {chat.title}
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-text-tertiary">{formatRelativeTime(chat.updatedAt)}</span>
        <div className="relative" ref={menuRef}>
          <IconButton size="sm" aria-label="Task options" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <MoreVertical />
          </IconButton>
          {open && (
            <div
              role="menu"
              aria-label="Task menu"
              className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-12 border border-border-secondary bg-surface-primary p-1.5 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  pinChat.mutate({ chatId: chat.id, pinned: !chat.pinned });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-8 px-2.5 py-2 text-xs text-text-primary hover:bg-surface-hover"
              >
                {chat.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                {chat.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  deleteChat.mutate(chat.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-8 px-2.5 py-2 text-xs text-error hover:bg-error/10"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
