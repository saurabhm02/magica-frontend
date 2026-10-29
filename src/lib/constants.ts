import type { RunMetadata } from "@/contracts/run";

export const FINAL_STATUSES: RunMetadata["status"][] = ["complete", "failed", "cancelled"];
export const TEXT_STREAM_ID = "text";

export const REST_POLL_INTERVAL_MS = 2500;

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
