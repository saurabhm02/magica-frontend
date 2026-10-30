"use client";

import { MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { Chat } from "@/contracts/chat";
import { useClickOutside } from "@/lib/use-click-outside";
import { usePinChat, useDeleteChat } from "@/queries/chats";
import { IconButton } from "@/components/ui/icon-button";

export function ChatMenu({ chat, onRename, className }: { chat: Chat; onRename: () => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, open, () => setOpen(false));
  const pinChat = usePinChat();
  const deleteChat = useDeleteChat();

  return (
    <div className={className} ref={menuRef}>
      <IconButton size="sm" aria-label={`Actions for ${chat.title}`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
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
              onRename();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-8 px-2.5 py-2 text-xs text-text-primary hover:bg-surface-hover"
          >
            <Pencil className="size-3.5" />
            Rename
          </button>
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
  );
}
