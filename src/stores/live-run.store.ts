import { create } from "zustand";
import type { SafeError } from "@/contracts/errors";
import type { RunMetadata, RunStatus } from "@/contracts/run";
import { FINAL_STATUSES } from "@/lib/constants";

function toMetadataStatus(status?: RunStatus | RunMetadata["status"]): RunMetadata["status"] {
  if (!status) return "queued";
  if (status === "running") return "working";
  if (status === "succeeded") return "complete";
  return status;
}

export type LiveRun = {
  runId?: string;
  triggerRunId?: string;
  accessToken?: string;
  status: RunMetadata["status"];
  text: string;
  thinkingStartedAt?: string;
  tools?: RunMetadata["tools"];
  assets?: RunMetadata["assets"];
  waitpoint?: RunMetadata["waitpoint"];
  currentStep?: string;
  error?: SafeError;
  isReconnecting?: boolean;
};

type LiveRunState = {
  runs: Record<string, LiveRun>; // keyed by chatId
  start: (chatId: string) => void;
  connect: (
    chatId: string,
    ids: { runId?: string; triggerRunId: string; accessToken: string; status?: RunStatus | RunMetadata["status"] },
  ) => void;
  stop: (chatId: string) => void;
  setStatus: (chatId: string, status: RunMetadata["status"]) => void;
  setReconnecting: (chatId: string, isReconnecting: boolean) => void;
  fail: (chatId: string, message: string) => void;
  setMetadata: (chatId: string, metadata: RunMetadata) => void;
  setText: (chatId: string, text: string) => void;
  clear: (chatId: string) => void;
  reset: () => void;
};

export const useLiveRunStore = create<LiveRunState>((set) => ({
  runs: {},

  start: (chatId) =>
    set((s) => ({
      runs: {
        ...s.runs,
        [chatId]: {
          status: "queued",
          text: "",
          thinkingStartedAt: new Date().toISOString(),
          tools: [],
          assets: [],
        },
      },
    })),

  connect: (chatId, ids) =>
    set((s) => {
      const existing = s.runs[chatId];
      const { status: inputStatus, ...restIds } = ids;
      const finalStatus: RunMetadata["status"] = inputStatus
        ? toMetadataStatus(inputStatus)
        : existing?.status ?? "queued";
      const item: LiveRun = {
        text: existing?.text ?? "",
        thinkingStartedAt: existing?.thinkingStartedAt,
        tools: existing?.tools ?? [],
        assets: existing?.assets ?? [],
        ...existing,
        ...restIds,
        status: finalStatus,
      };
      return {
        runs: {
          ...s.runs,
          [chatId]: item,
        },
      };
    }),

  stop: (chatId) =>
    update(set, chatId, { status: "stopping" }),

  setStatus: (chatId, status) =>
    update(set, chatId, { status }),

  setReconnecting: (chatId, isReconnecting) =>
    update(set, chatId, { isReconnecting }),

  fail: (chatId, message) =>
    update(set, chatId, { status: "failed", error: { code: "INTERNAL", message, retryable: true } }),

  setMetadata: (chatId, metadata) =>
    set((s) => {
      const run = s.runs[chatId];
      if (!run) return s;
      let thinkingStartedAt = run.thinkingStartedAt;
      if (!thinkingStartedAt) {
        thinkingStartedAt = metadata.thinkingStartedAt;
      } else if (metadata.thinkingStartedAt) {
        const existingMs = new Date(thinkingStartedAt).getTime();
        const incomingMs = new Date(metadata.thinkingStartedAt).getTime();
        if (incomingMs < existingMs) {
          thinkingStartedAt = metadata.thinkingStartedAt;
        }
      }
      // Once we've optimistically moved to "stopping", don't let a late in-flight
      // metadata update (e.g. still "working") bounce the status back.
      const status =
        run.status === "stopping" && !FINAL_STATUSES.includes(metadata.status) ? run.status : metadata.status;
      return { runs: { ...s.runs, [chatId]: { ...run, ...metadata, status, thinkingStartedAt } } };
    }),

  setText: (chatId, text) => update(set, chatId, { text }),

  clear: (chatId) =>
    set((s) => {
      if (!(chatId in s.runs)) return s;
      const runs = { ...s.runs };
      delete runs[chatId];
      return { runs };
    }),

  reset: () => set({ runs: {} }),
}));

function update(set: (fn: (s: LiveRunState) => Partial<LiveRunState>) => void, chatId: string, patch: Partial<LiveRun>) {
  set((s) => {
    const run = s.runs[chatId];
    return run ? { runs: { ...s.runs, [chatId]: { ...run, ...patch } } } : s;
  });
}
