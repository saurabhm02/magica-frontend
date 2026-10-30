"use client";

import { Check, ChevronLeft, ChevronRight, Copy, Heart, Pencil } from "lucide-react";
import { useState } from "react";
import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import type { PreviewItem } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function formatBytes(bytes?: number): string | undefined {
  if (!bytes) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string | undefined {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : undefined;
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

export function ImagePreviewModal({
  items,
  index,
  onIndexChange,
  open,
  onOpenChange,
}: {
  items: PreviewItem[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const item = items[index];
  const [dimensions, setDimensions] = useState<string | undefined>();
  const [linkCopied, setLinkCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [shownUrl, setShownUrl] = useState(item?.url);

  // Reset the per-item state when the previewed item changes, without an effect
  // (the official "adjusting state when a prop changes" pattern).
  if (item && shownUrl !== item.url) {
    setShownUrl(item.url);
    setDimensions(undefined);
    setLinkCopied(false);
    setPromptCopied(false);
  }

  if (!item) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(item.url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyPrompt = async () => {
    if (!item.prompt) return;
    await navigator.clipboard.writeText(item.prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <div className="p-5 pb-0">
          <DialogTitle>Image Preview</DialogTitle>
        </div>

        <div className="flex min-h-0 flex-1 gap-5 p-5">
          <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-16 bg-surface-secondary">
            {items.length > 1 && (
              <button
                type="button"
                aria-label="Previous"
                onClick={() => onIndexChange((index - 1 + items.length) % items.length)}
                className="absolute left-3 flex size-8 items-center justify-center rounded-full bg-surface-primary text-text-secondary hover:text-text-primary"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}

            {item.kind === "video" ? (
              <video
                src={item.url}
                controls
                className="max-h-full max-w-full rounded-10"
                onLoadedMetadata={(e) => setDimensions(`${e.currentTarget.videoWidth} X ${e.currentTarget.videoHeight}`)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.name}
                className="max-h-full max-w-full rounded-10 object-contain"
                onLoad={(e) => setDimensions(`${e.currentTarget.naturalWidth} X ${e.currentTarget.naturalHeight}`)}
              />
            )}

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => onIndexChange((index + 1) % items.length)}
                  className="absolute right-3 flex size-8 items-center justify-center rounded-full bg-surface-primary text-text-secondary hover:text-text-primary"
                >
                  <ChevronRight className="size-4" />
                </button>
                <span className="absolute bottom-3 rounded-full bg-surface-primary px-3 py-1 text-xs text-text-secondary">
                  {index + 1} / {items.length}
                </span>
              </>
            )}
          </div>

          <div className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">
            {item.prompt && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Prompt</span>
                  <button type="button" onClick={copyPrompt} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary">
                    {promptCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {promptCopied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-text-primary">{item.prompt}</p>
              </div>
            )}

            <div>
              <span className="text-xs text-text-secondary">File Name</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm text-text-primary">{item.name}</span>
                <button
                  type="button"
                  aria-disabled="true"
                  title={NOT_AVAILABLE_TOOLTIP}
                  className="shrink-0 cursor-not-allowed text-text-tertiary"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border-secondary pt-3">
              <Field label="Created on" value={formatDate(item.createdAt)} />
              <Field label="Source" value={item.source === "upload" ? "Uploaded" : "Generated via API"} />
              <Field label="Size" value={formatBytes(item.sizeBytes)} />
              <Field label="Dimensions" value={dimensions} />
            </div>

            <div className="mt-auto flex flex-col gap-2 border-t border-border-secondary pt-3">
              <button
                type="button"
                aria-disabled="true"
                title={NOT_AVAILABLE_TOOLTIP}
                className="flex h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-10 border border-border-secondary text-sm text-text-tertiary"
              >
                <Heart className="size-4" />
                Add to Favorite
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex h-9 items-center justify-center gap-1.5 rounded-10 border border-border-secondary text-sm text-text-primary hover:bg-surface-hover"
              >
                {linkCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {linkCopied ? "Copied" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
