"use client";

import { Download, Heart, Link, Square } from "lucide-react";
import type { AssetItem } from "@/contracts/api";
import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { extensionFromUrl } from "./file-name";

function stop(e: React.MouseEvent) {
  e.stopPropagation();
}

export function MediaTile({ asset, onClick }: { asset: AssetItem; onClick: () => void }) {
  const ext = extensionFromUrl(asset.url);

  const handleCopyLink = (e: React.MouseEvent) => {
    stop(e);
    navigator.clipboard.writeText(asset.url);
  };

  const handleDownload = (e: React.MouseEvent) => {
    stop(e);
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = asset.name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="group relative aspect-[191/128] w-full overflow-hidden rounded-10 bg-surface-primary">
      <button type="button" aria-label={`Image: ${asset.name}`} onClick={onClick} className="absolute inset-0 z-10" />

      {asset.type === "video" ? (
        <video src={asset.url} className="h-full w-full object-cover" muted />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45px] bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute inset-x-2 bottom-1.5 flex items-center gap-1">
        <span className="shrink-0 rounded-4 bg-black/50 px-1 py-0.5 text-[12px] leading-4 text-white">{ext}</span>
        <p className="min-w-0 truncate text-[12px] leading-4 text-white">{asset.name}</p>
      </div>

      <button
        type="button"
        aria-label="Select media"
        aria-disabled="true"
        title={NOT_AVAILABLE_TOOLTIP}
        onClick={stop}
        className="absolute top-2 left-2 z-20 flex size-7 cursor-not-allowed items-center justify-center rounded-8 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Square className="size-5" />
      </button>

      <div className="absolute top-2 right-2 z-20 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label="Copy link"
          onClick={handleCopyLink}
          className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <Link className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Download"
          onClick={handleDownload}
          className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <Download className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Favorite"
          aria-disabled="true"
          title={NOT_AVAILABLE_TOOLTIP}
          onClick={stop}
          className="flex size-7 cursor-not-allowed items-center justify-center rounded-full bg-black/60 text-white"
        >
          <Heart className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
