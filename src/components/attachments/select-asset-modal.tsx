"use client";

import { Info, RefreshCw, Search, SlidersHorizontal, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import type { AssetItem, AssetSource, AssetType } from "@/contracts/api";
import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAssets } from "@/queries/assets";
import { DayGroupHeader } from "@/components/library/day-group-header";
import { groupByDay } from "@/components/library/group-by-day";
import { MediaTabs, type MediaTab } from "@/components/library/media-tabs";
import { MediaTile } from "@/components/library/media-tile";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function sourceForTab(tab: MediaTab): AssetSource | undefined {
  return tab === "favorites" ? undefined : tab;
}

export function SelectAssetModal({
  open,
  onOpenChange,
  accept,
  fromField = false,
  onSelect,
  onUploadInstead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accept: AssetType;
  fromField?: boolean;
  onSelect: (asset: AssetItem) => void;
  onUploadInstead: (files: File[]) => void;
}) {
  const [tab, setTab] = useState<MediaTab>("all");
  const [query, setQuery] = useState("");
  const { data, isPending, refetch } = useAssets({ type: accept, source: sourceForTab(tab) }, tab !== "favorites");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const total = data?.pages[0]?.total ?? 0;
  const allItems = data?.pages.flatMap((page) => page.items) ?? [];
  const q = query.trim().toLowerCase();
  const items = allItems.filter((asset) => asset.name.toLowerCase().includes(q) || asset.prompt?.toLowerCase().includes(q));
  const groups = groupByDay(items);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[88vh] max-h-none w-[1060px] max-w-[96vw] rounded-16 border-0 bg-surface-main-background ring-1 ring-inset ring-border-secondary"
      >
        <div className="mx-4 mt-4 mb-5 flex flex-col gap-3 rounded-12 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <DialogTitle className="truncate text-lg font-semibold text-text-primary">
                {fromField ? `Select ${accept === "video" ? "Video" : "Image"}` : "Media Library"}
              </DialogTitle>
              <span className="min-h-4 text-[12px] leading-4 text-text-secondary">{total} files</span>
            </div>
            <button
              type="button"
              aria-label="Close media library"
              onClick={() => onOpenChange(false)}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search prompts & file names…"
                className="h-9 w-full rounded-full border-0 bg-surface-secondary pr-10 pl-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
            </div>
            <button
              type="button"
              aria-label="Refresh media library"
              onClick={() => refetch()}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Upload files to media library"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 min-w-[104px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-surface-tertiary px-3.5 text-sm font-medium text-text-primary hover:bg-surface-hover"
            >
              <UploadCloud className="size-4" />
              Upload media
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept === "video" ? "video/*" : "image/*"}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) onUploadInstead(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden pr-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-end justify-between gap-4 pt-4 pb-9 pr-4 pl-8">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-sm font-semibold text-text-primary">Your Media</p>
                <MediaTabs value={tab} onChange={setTab} />
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-surface-tertiary px-3 py-1 text-xs text-text-secondary">
                  {accept === "video" ? "Videos" : "Images"}
                </span>
                {["Sort", "Filter"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    aria-disabled="true"
                    title={NOT_AVAILABLE_TOOLTIP}
                    className="flex h-9 cursor-not-allowed items-center gap-1 rounded-full border border-border-secondary px-3.5 text-sm text-text-secondary"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mb-3 pr-4 pl-8">
                <div className="flex items-start gap-2 rounded-10 border border-info/30 bg-info/10 p-3 text-sm text-info">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <p className="leading-5">Generations made through API/MCP are deleted after 7 days. Download files you want to keep.</p>
                </div>
              </div>

              {tab === "favorites" ? (
                <p className="px-6 py-6 text-sm text-text-secondary">No favorites yet</p>
              ) : (
                <>
                  {isPending && <p className="px-6 py-6 text-sm text-text-secondary">Loading…</p>}
                  {data && items.length === 0 && <p className="px-6 py-6 text-sm text-text-secondary">No media yet.</p>}

                  <div className="flex flex-col gap-6 pb-2">
                    {groups.map((group) => (
                      <div key={group.label}>
                        <div className="mb-3 px-6">
                          <DayGroupHeader label={group.label} count={group.items.length} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 px-6">
                          {group.items.map((asset) => (
                            <MediaTile key={asset.url} asset={asset} onClick={() => onSelect(asset)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex w-[188px] shrink-0 flex-col pt-[44px]">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                aria-pressed="true"
                className={cn("flex h-8 w-full items-center gap-2 rounded-10 px-2.5 text-sm font-medium", "bg-surface-tertiary text-text-primary")}
              >
                All
              </button>
              <button
                type="button"
                aria-pressed="false"
                aria-disabled="true"
                title={NOT_AVAILABLE_TOOLTIP}
                className="flex h-8 w-full cursor-not-allowed items-center gap-2 rounded-10 px-2.5 text-sm font-medium text-text-secondary"
              >
                My folders
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
