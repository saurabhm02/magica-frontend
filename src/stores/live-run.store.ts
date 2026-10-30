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
  reasoning?: string; // the model's thinking, streamed live
  thinkingStartedAt?: string;
  tools?: RunMetadata["tools"];
  assets?: RunMetadata["assets"];
  waitpoint?: RunMetadata["waitpoint"];
  plan?: RunMetadata["plan"];
  currentStep?: string;
  error?: SafeError;
  isReconnecting?: boolean;
};

type LiveRunState = {
  runs: Record<string, LiveRun>; // keyed by chatId
  start: (chatId: string) => void;
  connect: (
    chatId: string,
    ids: {
      runId?: string;
      triggerRunId: string;
      accessToken: string;
      status?: RunStatus | RunMetadata["status"];
      waitpoint?: RunMetadata["waitpoint"];
    },
  ) => void;
  stop: (chatId: string) => void;
  setStatus: (chatId: string, status: RunMetadata["status"]) => void;
  setReconnecting: (chatId: string, isReconnecting: boolean) => void;
  fail: (chatId: string, message: string) => void;
  setMetadata: (chatId: string, metadata: RunMetadata) => void;
  setText: (chatId: string, text: string) => void;
  setReasoning: (chatId: string, reasoning: string) => void;
  clearWaitpoint: (chatId: string) => void;
  clear: (chatId: string) => void;
  reset: () => void;
};

/**
 * Client-side state for agent runs that are in progress, one entry per chat.
 * A live run holds the run and realtime ids, the access token, the status, the streamed reply
 * text and reasoning, and the latest metadata (tools, assets, waitpoint, plan, current step, error).
 *
 * Output:
 * - runs keyed by chatId, plus actions to start, connect, update, stop, fail and clear a run.
 *
 * Notes:
 * - connect keeps any text and tools already streamed, so reconnecting does not wipe the screen.
 * - A late metadata update cannot move a "stopping" run back to a non-final status.
 * - Each metadata update is a full snapshot, so a missing waitpoint means it was resolved.
 */
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
        waitpoint: existing?.waitpoint,
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
      // Metadata is a full snapshot: a waitpoint absent from this update is a
      // waitpoint that's been resolved, so clear it explicitly rather than let the
      // spread below silently keep the stale one.
      return {
        runs: { ...s.runs, [chatId]: { ...run, ...metadata, status, thinkingStartedAt, waitpoint: metadata.waitpoint } },
      };
    }),

  setText: (chatId, text) => update(set, chatId, { text }),

  setReasoning: (chatId, reasoning) => update(set, chatId, { reasoning }),

  clearWaitpoint: (chatId) => update(set, chatId, { waitpoint: undefined }),

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
