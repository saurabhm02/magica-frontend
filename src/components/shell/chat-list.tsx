"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Chat } from "@/contracts/chat";
import { useChats } from "@/queries/chats";

export function ChatList() {
  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useChats();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) fetchNextPage();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-1 px-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[34px] animate-pulse rounded-10 bg-surface-tertiary" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-3 text-center">
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
      <div className="flex flex-1 items-center justify-center px-3">
        <p className="text-sm text-text-secondary">No tasks yet</p>
      </div>
    );
  }

  const pinned = chats.filter((chat) => chat.pinned);
  const recent = chats.filter((chat) => !chat.pinned);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
      {pinned.length > 0 && <ChatSection label="Pinned" chats={pinned} />}
      {recent.length > 0 && <ChatSection label={pinned.length > 0 ? "Recent" : undefined} chats={recent} />}
      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className="text-center text-xs text-text-tertiary">Loading more…</p>}
    </div>
  );
}

function ChatSection({ label, chats }: { label?: string; chats: Chat[] }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <p className="px-2 text-xs text-text-tertiary">{label}</p>}
      {chats.map((chat) => (
        <Link
          key={chat.id}
          href={`/chat/${chat.id}`}
          className="truncate rounded-10 px-2 py-2 text-sm text-text-primary hover:bg-surface-hover"
        >
          {chat.title}
        </Link>
      ))}
    </div>
  );
}
