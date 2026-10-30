"use client";

import { useState } from "react";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useAssets } from "@/queries/assets";
import { ImagePreviewModal } from "@/components/attachments/image-preview-modal";
import { DayGroupHeader } from "@/components/library/day-group-header";
import { groupByDay } from "@/components/library/group-by-day";
import { MediaTabs, type MediaTab } from "@/components/library/media-tabs";
import { MediaTile } from "@/components/library/media-tile";
import { SearchInput } from "@/components/ui/search-input";

function sourceForTab(tab: MediaTab) {
  return tab === "favorites" ? undefined : tab;
}

export default function LibraryPage() {
  const [tab, setTab] = useState<MediaTab>("all");
  const [query, setQuery] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useAssets(
    { source: sourceForTab(tab) },
    tab !== "favorites",
  );
  const sentinelRef = useInfiniteScroll(hasNextPage, fetchNextPage);

  const total = data?.pages[0]?.total ?? 0;
  const allItems = data?.pages.flatMap((page) => page.items) ?? [];
  const q = query.trim().toLowerCase();
  const items = allItems.filter((asset) => asset.name.toLowerCase().includes(q) || asset.prompt?.toLowerCase().includes(q));
  const groups = groupByDay(items);
  const previewItems = items.map((asset) => ({
    url: asset.url,
    kind: asset.type,
    name: asset.name,
    source: asset.source,
    createdAt: asset.createdAt,
    sizeBytes: asset.sizeBytes ?? undefined,
    prompt: asset.prompt ?? undefined,
  }));

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <h1 className="text-2xl font-bold text-text-primary">Library</h1>

      <div className="mt-6">
        <SearchInput value={query} onChange={setQuery} placeholder="Search media..." />
      </div>

      <p className="mt-4 text-sm text-text-secondary">{total} files</p>

      <div className="mt-4">
        <MediaTabs value={tab} onChange={setTab} />
      </div>

      {tab === "favorites" ? (
        <p className="mt-6 text-sm text-text-secondary">No favorites yet</p>
      ) : (
        <>
          {isPending && <p className="mt-6 text-sm text-text-secondary">Loading…</p>}
          {isError && <p className="mt-6 text-sm text-text-secondary">Couldn&apos;t load media.</p>}
          {data && items.length === 0 && <p className="mt-6 text-sm text-text-secondary">No media yet.</p>}

          <div className="mt-6 flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.label}>
                <DayGroupHeader label={group.label} count={group.items.length} />
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.items.map((asset) => (
                    <MediaTile key={asset.url} asset={asset} onClick={() => setPreviewIndex(items.indexOf(asset))} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div ref={sentinelRef} />
          {isFetchingNextPage && <p className="mt-4 text-center text-xs text-text-tertiary">Loading more…</p>}
        </>
      )}

      {previewIndex !== null && (
        <ImagePreviewModal
          items={previewItems}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          open
          onOpenChange={(open) => !open && setPreviewIndex(null)}
        />
      )}
    </div>
  );
}
