import type { RunMetadata } from "@/contracts/run";

export const FINAL_STATUSES: RunMetadata["status"][] = ["complete", "failed", "cancelled"];
export const TEXT_STREAM_ID = "text";
