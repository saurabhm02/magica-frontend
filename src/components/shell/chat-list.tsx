"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Chat } from "@/contracts/chat";
import { FINAL_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useChats } from "@/queries/chats";
import { useLiveRunStore } from "@/stores/live-run.store";
import { ChatMenu } from "./chat-menu";
import { useChatRename } from "./use-chat-rename";

export function ChatList({ collapsed }: { collapsed?: boolean }) {
  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useChats();
  const sentinelRef = useInfiniteScroll(hasNextPage, fetchNextPage);

  if (collapsed) return null;

  if (isPending) {
    return (
      <div className="flex flex-col gap-0.5 px-2 pt-0.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[34px] animate-pulse rounded-10 bg-surface-tertiary" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2 text-center">
        <p className="text-sm text-text-secondary">Couldn&apos;t load tasks.</p>
        <button type="button" onClick={() => refetch()} className="text-sm text-text-primary underline">
          Retry
        </button>
      </div>
    );
  }

  const chats = data.pages.flatMap((page) => page.items);

  if (chats.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-2">
        <p className="text-sm text-text-secondary">No tasks yet</p>
      </div>
    );
  }

  const pinned = chats.filter((chat) => chat.pinned);
  const recent = chats.filter((chat) => !chat.pinned);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 pt-0.5 pb-2">
      {pinned.length > 0 && <ChatSection label="Pinned" chats={pinned} />}
      {recent.length > 0 && <ChatSection label={pinned.length > 0 ? "Recent" : undefined} chats={recent} />}
      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className="text-center text-xs text-text-tertiary">Loading more…</p>}
    </div>
  );
}

function ChatRow({ chat }: { chat: Chat }) {
  const pathname = usePathname();
  const isActive = pathname === `/chat/${chat.id}`;
  const isRunning = useLiveRunStore((s) => {
    const run = s.runs[chat.id];
    return !!run && !FINAL_STATUSES.includes(run.status);
  });
  const rename = useChatRename(chat);

  if (rename.editing) {
    return (
      <input
        autoFocus
        value={rename.title}
        onChange={(e) => rename.setTitle(e.target.value)}
        onBlur={rename.save}
        onKeyDown={(e) => {
          if (e.key === "Enter") rename.save();
          if (e.key === "Escape") rename.cancel();
        }}
        className="h-[34px] w-full rounded-10 bg-surface-tertiary px-2 text-sm text-text-primary focus:outline-none"
      />
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-10 text-text-secondary transition-colors duration-75 hover:bg-surface-secondary hover:text-text-primary",
        isActive && "bg-surface-tertiary text-text-primary shadow-[inset_0_0_0_1px_var(--color-border-secondary)] hover:bg-surface-tertiary",
      )}
    >
      <Link
        href={`/chat/${chat.id}`}
        aria-current={isActive ? "page" : undefined}
        className="flex h-[34px] min-w-0 flex-1 items-center gap-2 truncate px-2 text-sm font-medium group-hover:pr-9 group-focus-within:pr-9"
      >
        <span className="truncate">{chat.title}</span>
        {isRunning && <Loader2 aria-label="Run in progress" className="h-3.5 w-3.5 shrink-0 animate-spin text-text-tertiary" />}
      </Link>
      <ChatMenu
        chat={chat}
        onRename={rename.start}
        className="absolute right-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
      />
    </div>
  );
}

function ChatSection({ label, chats }: { label?: string; chats: Chat[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && <p className="px-2 py-1 text-xs leading-4 text-text-secondary">{label}</p>}
      {chats.map((chat) => (
        <ChatRow key={chat.id} chat={chat} />
      ))}
    </div>
  );
}
