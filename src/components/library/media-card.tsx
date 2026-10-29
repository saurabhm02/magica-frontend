"use client";

import { Copy, Download } from "lucide-react";
import type { AssetItem } from "@/contracts/api";
import { useUiStore } from "@/stores/ui.store";
import { fileNameFromUrl } from "./file-name";

export function MediaCard({ asset }: { asset: AssetItem }) {
  const openMediaArtifact = useUiStore((s) => s.openMediaArtifact);
  const { name, ext } = fileNameFromUrl(asset.url);

  const handleCopyLink = () => navigator.clipboard.writeText(asset.url);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="group relative aspect-square overflow-hidden rounded-16 border border-border-secondary bg-surface-secondary">
      <button
        type="button"
        aria-label={name}
        onClick={() => openMediaArtifact({ type: asset.type, url: asset.url, title: name })}
        className="absolute inset-0"
      >
        {asset.type === "video" ? (
          <video src={asset.url} className="h-full w-full object-cover" muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.url} alt={name} className="h-full w-full object-cover" loading="lazy" />
        )}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5 text-xs text-white">
        <span className="truncate">
          {ext} {name}
        </span>
      </div>

      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label="Copy link"
          onClick={handleCopyLink}
          className="flex h-7 w-7 items-center justify-center rounded-8 bg-black/60 text-white backdrop-blur hover:bg-black/80"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Download"
          onClick={handleDownload}
          className="flex h-7 w-7 items-center justify-center rounded-8 bg-black/60 text-white backdrop-blur hover:bg-black/80"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
