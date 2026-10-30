"use client";

import { Loader2, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { ImagePreviewModal } from "@/components/attachments/image-preview-modal";
import type { AttachmentItem } from "@/lib/types";
import { useComposer } from "./composer-context";

function toPreviewItem(item: AttachmentItem) {
  return {
    url: item.url ?? item.previewUrl ?? "",
    kind: item.kind,
    name: item.name,
    source: "upload" as const,
  };
}

export function ComposerChips() {
  const { attachments, removeAttachment, retryAttachment } = useComposer();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (attachments.length === 0) return null;

  const previewItems = attachments.filter((item) => item.status !== "failed").map(toPreviewItem);

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((item) => {
        const previewable = item.status !== "failed";
        const index = previewItems.findIndex((p) => p.url === (item.url ?? item.previewUrl));

        return (
          <div
            key={item.id}
            className="relative size-14 shrink-0 overflow-hidden rounded-10 border border-border-secondary bg-surface-secondary"
          >
            {previewable ? (
              <button
                type="button"
                aria-label={`Open ${item.name}`}
                onClick={() => setPreviewIndex(index)}
                className="h-full w-full"
              >
                {item.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
                )}
              </button>
            ) : (
              <button
                type="button"
                aria-label={`Retry ${item.name}`}
                title={item.error}
                onClick={() => retryAttachment(item.id)}
                className="flex h-full w-full items-center justify-center text-error"
              >
                <RotateCcw className="size-4" />
              </button>
            )}

            {item.status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="size-4 animate-spin text-white" />
              </div>
            )}

            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              onClick={() => removeAttachment(item.id)}
              className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="size-2.5" />
            </button>
          </div>
        );
      })}

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
