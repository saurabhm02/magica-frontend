"use client";

import { ImageIcon, Plus } from "lucide-react";
import { useRef } from "react";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function UploadPopover({
  accept,
  trigger,
  onSelectAsset,
  onUpload,
}: {
  accept: "image" | "video";
  trigger: React.ReactElement;
  onSelectAsset: () => void;
  onUpload: (files: File[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Popover>
        <PopoverTrigger render={trigger} />
        <PopoverContent className="w-72">
          <p className="px-1 pb-3 text-sm text-text-secondary">
            Add a file from your device or select one from your library
          </p>
          <div className="flex flex-col gap-1.5">
            <PopoverClose
              type="button"
              onClick={onSelectAsset}
              className="flex h-10 items-center gap-2 rounded-10 bg-surface-tertiary px-3 text-sm text-text-primary hover:bg-surface-hover"
            >
              <ImageIcon className="size-4" />
              Select Asset
            </PopoverClose>
            <PopoverClose
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 items-center gap-2 rounded-10 bg-surface-tertiary px-3 text-sm text-text-primary hover:bg-surface-hover"
            >
              <Plus className="size-4" />
              Upload
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept === "video" ? "video/*" : "image/*"}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onUpload(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </>
  );
}
