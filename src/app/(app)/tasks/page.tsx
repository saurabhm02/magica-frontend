"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { TaskRow } from "@/components/tasks/task-row";
import { SearchInput } from "@/components/ui/search-input";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useChats } from "@/queries/chats";

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageContent />
    </Suspense>
  );
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useChats(
    debouncedQuery.trim() || undefined,
  );
  const sentinelRef = useInfiniteScroll(hasNextPage, fetchNextPage);

  const chats = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto max-w-[900px] p-6">
      <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>

      <div className="mt-6">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search tasks..."
          autoFocus={searchParams.get("focus") === "1"}
        />
      </div>

      <div className="mt-4 flex flex-col gap-1">
        {isPending && <p className="text-sm text-text-secondary">Loading…</p>}
        {isError && <p className="text-sm text-text-secondary">Couldn&apos;t load tasks.</p>}
        {data && chats.length === 0 && <p className="text-sm text-text-secondary">No tasks yet</p>}
        {chats.map((chat) => (
          <TaskRow key={chat.id} chat={chat} />
        ))}
        <div ref={sentinelRef} />
        {isFetchingNextPage && <p className="text-center text-xs text-text-tertiary">Loading more…</p>}
      </div>
    </div>
  );
}
