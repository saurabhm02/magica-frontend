import type { RunMetadata } from "@/contracts/run";

export const FINAL_STATUSES: RunMetadata["status"][] = ["complete", "failed", "cancelled"];
export const TEXT_STREAM_ID = "text";
export const REASONING_STREAM_ID = "reasoning";

export const REST_POLL_INTERVAL_MS = 2500;

export const NOT_AVAILABLE_TOOLTIP = "Not available in this demo";

export function formatCredits(microcredits?: number, options?: { precision?: number }): string {
  if (microcredits === undefined || microcredits === null) return "";
  const m = microcredits / 1_000_000;
  const decimals = options?.precision ?? (m > 0 && m < 0.01 ? 3 : 2);
  const fixed = m.toFixed(decimals);
  // A custom precision shows "up to" that many decimals: trim the padding zeros it added.
  return `${options?.precision ? fixed.replace(/\.?0+$/, "") : fixed}M`;
}

export function formatSummaryLine(doneLabels: string[]): string {
  if (doneLabels.length === 0) return "";
  const joined = doneLabels.join(", ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

const RELATIVE_TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(isoString: string): string {
  const diffSeconds = (new Date(isoString).getTime() - Date.now()) / 1000;
  for (const [unit, secondsInUnit] of RELATIVE_TIME_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return relativeTimeFormatter.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return relativeTimeFormatter.format(Math.round(diffSeconds / 60), "minute");
}
