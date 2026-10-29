"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Image,
  type LucideIcon,
  Loader2,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCredits } from "@/lib/constants";
import type { StepItem } from "@/lib/types";
import { useUiStore } from "@/stores/ui.store";

const STEP_STATUS: Record<StepItem["status"], { label: string; className: string; Icon: LucideIcon }> = {
  pending: { label: "Pending", className: "text-text-secondary", Icon: Clock },
  running: { label: "Running", className: "text-text-secondary", Icon: Loader2 },
  succeeded: { label: "Completed", className: "text-success", Icon: CheckCircle2 },
  failed: { label: "Failed", className: "text-error", Icon: AlertCircle },
  cancelled: { label: "Cancelled", className: "text-text-secondary", Icon: AlertCircle },
};

export function ArtifactPanel() {
  const artifactPanel = useUiStore((s) => s.artifactPanel);
  const closeArtifact = useUiStore((s) => s.closeArtifact);
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeArtifact();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeArtifact]);

  useEffect(() => {
    closeArtifact();
  }, [pathname, closeArtifact]);

  if (!artifactPanel) return null;

  const { step, asset } = artifactPanel;

  const stepMedia = step?.assets?.[0];
  const mediaUrl = asset?.url ?? stepMedia?.url;
  const mediaType = asset?.type ?? stepMedia?.type ?? "image";

  const title = step?.label || asset?.title || "Artifact details";
  const modelName =
    step?.model ||
    step?.fields?.find((f) => f.label.toLowerCase().includes("model"))?.value ||
    "Model";
  const creditsStr = step?.credits !== undefined ? `${formatCredits(step.credits)} credits` : undefined;
  const { label: statusLabel, className: statusClassName, Icon: StatusIcon } = STEP_STATUS[step?.status ?? "succeeded"];

  const handleCopy = async () => {
    if (!mediaUrl) return;
    await navigator.clipboard.writeText(mediaUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const IconComponent = mediaType === "video" ? Video : Image;

  return (
    <aside
      data-testid="artifact-panel"
      aria-label="Artifact details"
      className="fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l border-border-secondary bg-surface-main-background p-4 sm:relative sm:w-[420px] lg:w-[460px] overflow-y-auto"
    >
      {/* Header matching frame 07 */}
      <div className="flex items-center justify-between border-b border-border-secondary pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <IconComponent className="h-4 w-4 text-text-secondary shrink-0" />
          <h3 className="text-sm font-semibold text-text-primary truncate">{title}</h3>
        </div>
        <button
          type="button"
          onClick={closeArtifact}
          aria-label="Close artifact panel"
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 py-4">
        {/* Card 1: Model, Credits, Status */}
        <div className="rounded-12 border border-border-secondary bg-surface-primary p-3 flex flex-col gap-2.5 text-xs">
          <div>
            <span className="text-text-secondary block mb-0.5">Model</span>
            <span className="text-text-primary font-medium">{modelName}</span>
          </div>

          {creditsStr && (
            <div>
              <span className="text-text-secondary block mb-0.5">Credits Used</span>
              <span className="text-text-primary font-medium">{creditsStr}</span>
            </div>
          )}

          <div>
            <span className="text-text-secondary block mb-0.5">Status</span>
            <div className={cn("flex items-center gap-1.5 font-medium", statusClassName)}>
              <StatusIcon className={cn("h-3.5 w-3.5", step?.status === "running" && "animate-spin")} />
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fields (Prompt, Outputs, Size, Background, Format) */}
        {step?.fields && step.fields.length > 0 && (
          <div className="rounded-12 border border-border-secondary bg-surface-primary p-3 flex flex-col gap-2.5 text-xs">
            {step.fields.map((field, idx) => (
              <div key={idx}>
                <span className="text-text-secondary block mb-0.5">{field.label}</span>
                <span className="text-text-primary font-medium break-words">{field.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Card 3: Media view */}
        {mediaUrl && (
          <div className="rounded-12 border border-border-secondary bg-surface-primary overflow-hidden p-2 flex flex-col items-center">
            {mediaType === "video" ? (
              <video src={mediaUrl} controls autoPlay loop className="max-h-[50vh] w-full rounded-8" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt={title}
                className="max-h-[50vh] w-auto rounded-8 object-contain"
              />
            )}
          </div>
        )}
      </div>

      {/* Footer action buttons */}
      {mediaUrl && (
        <div className="mt-auto flex items-center gap-2 border-t border-border-secondary pt-3">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-10 bg-surface-secondary px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-tertiary transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open original</span>
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-10 bg-surface-secondary px-3 py-2 text-xs font-medium text-text-primary hover:bg-surface-tertiary transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy link"}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
