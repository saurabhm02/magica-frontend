"use client";

import { Download, ImagePlay, Link, Loader2, MoreVertical } from "lucide-react";
import { useRef, useState } from "react";
import type { ToolRunAsset } from "@/contracts/api";
import type { SafeError } from "@/contracts/errors";
import { useClickOutside } from "@/lib/use-click-outside";
import { EstimateBadge } from "./estimate-badge";

export type OutputStatus = "idle" | "running" | "succeeded" | "failed" | "cancelled";

export function OutputCard({
  status,
  error,
  assets,
  credits,
}: {
  status: OutputStatus;
  error?: SafeError | null;
  assets: ToolRunAsset[];
  credits?: number;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-12 border border-border-tertiary bg-surface-main-background shadow-sm lg:h-[600px]">
      <div className="flex items-center justify-between gap-3 border-b border-border-tertiary px-4 py-4">
        <div>
          <h2 className="text-lg leading-7 font-semibold text-text-primary">Output</h2>
          <p className="text-sm text-text-secondary">Results from model execution</p>
        </div>
        {status === "succeeded" && (
          <div className="flex items-center gap-2">
            <EstimateBadge credits={credits} />
            <span className="text-xs font-semibold tracking-wide text-success uppercase">Completed</span>
          </div>
        )}
      </div>

      {status === "succeeded" ? (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {assets.map((asset, i) => (
            <ResultAsset key={i} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
          {status === "idle" && (
            <div className="flex flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-10 bg-surface-secondary/40">
                <ImagePlay className="size-9 text-text-secondary/70" />
              </span>
              <p className="mt-2 text-sm font-semibold text-text-primary">No output yet</p>
              <p className="mt-1 text-[13px] text-text-secondary">Configure inputs and click generate</p>
            </div>
          )}

          {status === "running" && (
            <div className="flex flex-col items-center gap-2 text-center">
              <Loader2 className="size-6 animate-spin text-text-tertiary" />
              <p className="text-sm font-medium text-text-primary">Generating...</p>
              <p className="text-xs text-text-secondary">This may take a moment</p>
            </div>
          )}

          {status === "failed" && <p className="text-sm text-error">{error?.message ?? "Something went wrong."}</p>}
          {status === "cancelled" && <p className="text-sm text-text-secondary">Cancelled</p>}
        </div>
      )}
    </div>
  );
}

function ResultAsset({ asset }: { asset: ToolRunAsset }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, menuOpen, () => setMenuOpen(false));

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = "";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setMenuOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(asset.url);
    setMenuOpen(false);
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-10 bg-black/20">
      {asset.type === "video" ? (
        <video src={asset.url} controls className="h-full w-full object-contain" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt="Generated output" className="h-full w-full object-contain" />
      )}

      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          type="button"
          aria-label="Output actions"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <MoreVertical className="size-3.5" />
        </button>
        {menuOpen && (
          <div role="menu" className="absolute top-full right-0 z-10 mt-1 min-w-[150px] rounded-10 border border-border-secondary bg-surface-primary p-1.5 shadow-lg">
            <button
              type="button"
              role="menuitem"
              onClick={handleDownload}
              className="flex w-full items-center gap-2 rounded-8 px-2.5 py-2 text-xs text-text-primary hover:bg-surface-hover"
            >
              <Download className="size-3.5" />
              Download
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2 rounded-8 px-2.5 py-2 text-xs text-text-primary hover:bg-surface-hover"
            >
              <Link className="size-3.5" />
              Copy link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
