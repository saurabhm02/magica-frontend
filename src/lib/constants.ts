import { Image, Info, Video, Wrench, type LucideIcon } from "lucide-react";
import type { RunMetadata } from "@/contracts/run";

export const FINAL_STATUSES: RunMetadata["status"][] = ["complete", "failed", "cancelled"];
export const TEXT_STREAM_ID = "text";

export const RENDER_KEY_ICONS: Record<string, LucideIcon> = {
  "image-result": Image,
  "video-result": Video,
  "model-info": Info,
};

export function getRenderKeyIcon(renderKey?: string): LucideIcon {
  return (renderKey && RENDER_KEY_ICONS[renderKey]) || Wrench;
}

export function formatCredits(microcredits?: number): string {
  if (microcredits === undefined || microcredits === null) return "";
  const m = microcredits / 1_000_000;
  return `${m.toFixed(2)}M`;
}

export function formatSummaryLine(doneLabels: string[]): string {
  if (doneLabels.length === 0) return "";
  const joined = doneLabels.join(", ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}
