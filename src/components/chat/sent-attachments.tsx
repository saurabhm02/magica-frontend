"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import type { Attachment } from "@/contracts/attachment";
import { ImagePreviewModal } from "@/components/attachments/image-preview-modal";

function toPreviewItem(attachment: Attachment) {
  return {
    url: attachment.url,
    kind: attachment.kind,
    name: attachment.name,
    source: attachment.source === "upload" ? ("upload" as const) : ("generated" as const),
    createdAt: attachment.createdAt,
    sizeBytes: attachment.sizeBytes || undefined,
  };
}

export function SentAttachments({ attachments }: { attachments: Attachment[] }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  if (attachments.length === 0) return null;

  return (
    <div className="flex justify-end gap-2">
      {attachments.map((attachment, i) => (
        <Thumbnail key={attachment.id} attachment={attachment} onClick={() => setPreviewIndex(i)} />
      ))}

      {previewIndex !== null && (
        <ImagePreviewModal
          items={attachments.map(toPreviewItem)}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          open
          onOpenChange={(open) => !open && setPreviewIndex(null)}
        />
      )}
    </div>
  );
}

function Thumbnail({ attachment, onClick }: { attachment: Attachment; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button type="button" aria-label={`Open ${attachment.name}`} onClick={onClick} className="relative size-[110px] shrink-0 overflow-hidden rounded-16">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface-tertiary" />}
      {attachment.kind === "video" ? (
        <video src={attachment.url} className="h-full w-full object-cover" muted onLoadedData={() => setLoaded(true)} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={attachment.name}
          className="h-full w-full object-cover"
          onLoad={() => setLoaded(true)}
        />
      )}
      {attachment.kind === "video" && loaded && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Play className="size-6 fill-white text-white" />
        </span>
      )}
    </button>
  );
}
