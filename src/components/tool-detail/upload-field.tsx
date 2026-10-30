"use client";

import { Loader2, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AssetItem, AssetType } from "@/contracts/api";
import { useAttachments } from "@/components/attachments/use-attachments";
import { SelectAssetModal } from "@/components/attachments/select-asset-modal";
import { UploadPopover } from "@/components/attachments/upload-popover";

export function UploadField({
  scopeId,
  accept,
  multiple,
  maxFiles,
  onChange,
  onUploadingChange,
}: {
  scopeId: string;
  accept: AssetType;
  multiple: boolean;
  maxFiles?: number;
  onChange: (urls: string[]) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const { items, addFiles, addFromLibrary, removeAttachment, retryAttachment } = useAttachments(scopeId, {
    maxFiles: maxFiles ?? (multiple ? 10 : 1),
  });
  const [modalOpen, setModalOpen] = useState(false);
  const label = accept === "video" ? "Video" : "Image";

  // onChange/onUploadingChange are re-created every render by the parent form; keep the
  // effects keyed only on `items` so they don't re-fire on every parent render.
  const onChangeRef = useRef(onChange);
  const onUploadingChangeRef = useRef(onUploadingChange);
  useEffect(() => {
    onChangeRef.current = onChange;
    onUploadingChangeRef.current = onUploadingChange;
  });

  useEffect(() => {
    onChangeRef.current(items.filter((item) => item.status === "ready" && item.url).map((item) => item.url as string));
  }, [items]);

  useEffect(() => {
    onUploadingChangeRef.current(items.some((item) => item.status === "uploading"));
  }, [items]);

  function handleSelect(asset: AssetItem) {
    addFromLibrary(asset);
    setModalOpen(false);
  }

  const hasReady = items.some((item) => item.status === "ready");

  return (
    <div>
      <div className="rounded-12 bg-surface-secondary/30 p-4">
        <UploadPopover
          accept={accept}
          onSelectAsset={() => setModalOpen(true)}
          onUpload={addFiles}
          trigger={
            <button
              type="button"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-10 border border-dashed border-border-secondary text-sm text-text-secondary hover:bg-surface-hover"
            >
              <UploadCloud className="size-4" />
              {hasReady ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
            </button>
          }
        />
      </div>

      {items.some((item) => item.status === "uploading") && <p className="mt-1.5 text-xs text-text-tertiary">Uploading...</p>}

      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative size-16 shrink-0 overflow-hidden rounded-10 border border-border-secondary bg-surface-secondary">
              {item.status === "uploading" && (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-text-tertiary" />
                </div>
              )}
              {item.status === "failed" && (
                <button
                  type="button"
                  title={item.error}
                  onClick={() => retryAttachment(item.id)}
                  aria-label={`Retry ${item.name}`}
                  className="flex h-full w-full items-center justify-center text-xs text-error"
                >
                  Retry
                </button>
              )}
              {item.status === "ready" && item.previewUrl && item.kind === "video" && (
                <video src={item.previewUrl} className="h-full w-full object-cover" muted />
              )}
              {item.status === "ready" && item.previewUrl && item.kind !== "video" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => removeAttachment(item.id)}
                className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border border-border-secondary bg-surface-primary text-text-primary"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <SelectAssetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        accept={accept}
        fromField
        onSelect={handleSelect}
        onUploadInstead={(files) => {
          addFiles(files);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
