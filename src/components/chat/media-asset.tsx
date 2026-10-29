"use client";

import { Download, ExternalLink } from "lucide-react";
import type { ArtifactAsset } from "@/lib/types";
import { useUiStore } from "@/stores/ui.store";

export function MediaAsset({ asset }: { asset: ArtifactAsset }) {
  const openMediaArtifact = useUiStore((s) => s.openMediaArtifact);
  const isVideo = asset.type === "video";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = asset.title || "generated-media";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      data-testid="media-asset"
      className="group relative my-3 max-w-[460px] w-full overflow-hidden rounded-16 border border-border-secondary bg-surface-secondary transition hover:border-text-secondary"
    >
      {isVideo ? (
        <video src={asset.url} controls className="max-h-[460px] w-full rounded-16" />
      ) : (
        <button
          type="button"
          aria-label={asset.title || "View image"}
          onClick={() => openMediaArtifact(asset)}
          className="block w-full focus:outline-none focus-visible:ring-1 focus-visible:ring-text-secondary"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.url}
            alt={asset.title || "Generated image"}
            className="max-h-[460px] w-full rounded-16 object-cover"
            loading="lazy"
          />
        </button>
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="Open artifact panel"
          onClick={() => openMediaArtifact(asset)}
          className="flex h-8 w-8 items-center justify-center rounded-8 bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={isVideo ? "Download video" : "Download image"}
          onClick={handleDownload}
          className="flex h-8 w-8 items-center justify-center rounded-8 bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
