import type { RunMetadata } from "@/contracts/run";

export const FINAL_STATUSES: RunMetadata["status"][] = ["complete", "failed", "cancelled"];
