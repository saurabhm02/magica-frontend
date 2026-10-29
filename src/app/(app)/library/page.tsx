"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useAssets } from "@/queries/assets";
import { SearchInput } from "@/components/ui/search-input";
import { fileNameFromUrl } from "@/components/library/file-name";
import { groupByDay } from "@/components/library/group-by-day";
import { MediaCard } from "@/components/library/media-card";

type Tab = "all" | "generated" | "uploads";
const TABS: { label: string; value: Tab }[] = [
  { label: "All", value: "all" },
  { label: "Generated", value: "generated" },
  { label: "My Uploads", value: "uploads" },
];

export default function LibraryPage() {
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useAssets();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const sentinelRef = useInfiniteScroll(hasNextPage, fetchNextPage);

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];
  // "My Uploads" isn't tracked separately yet; every asset currently comes from a tool run.
  const tabItems = tab === "uploads" ? [] : allItems;
  const items = tabItems.filter((asset) =>
    fileNameFromUrl(asset.url).name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const groups = groupByDay(items);

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <h1 className="text-2xl font-bold text-text-primary">Library</h1>

      <div className="mt-6">
        <SearchInput value={query} onChange={setQuery} placeholder="Search media..." />
      </div>

      {data && <p className="mt-4 text-sm text-text-secondary">{allItems.length} files</p>}

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "h-9 rounded-full px-4 text-sm transition",
              tab === t.value
                ? "bg-surface-tertiary text-text-primary"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-hover",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isPending && <p className="mt-6 text-sm text-text-secondary">Loading…</p>}
      {isError && <p className="mt-6 text-sm text-text-secondary">Couldn&apos;t load media.</p>}
      {data && items.length === 0 && <p className="mt-6 text-sm text-text-secondary">No media yet.</p>}

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-3 text-sm font-semibold text-text-primary">
              {group.label} <span className="font-normal text-text-tertiary">· {group.items.length} Items</span>
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.items.map((asset) => (
                <MediaCard key={asset.url} asset={asset} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className="mt-4 text-center text-xs text-text-tertiary">Loading more…</p>}
    </div>
  );
}
