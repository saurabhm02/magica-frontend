import { create } from "zustand";
import type { SafeError } from "@/contracts/errors";
import type { RunMetadata } from "@/contracts/run";

export type LiveRun = {
  triggerRunId?: string;
  accessToken?: string;
  status: RunMetadata["status"];
  text: string;
  thinkingStartedAt?: string;
  error?: SafeError;
};

type LiveRunState = {
  runs: Record<string, LiveRun>; // keyed by chatId
  start: (chatId: string) => void;
  connect: (chatId: string, ids: { triggerRunId: string; accessToken: string }) => void;
  fail: (chatId: string, message: string) => void;
  setMetadata: (chatId: string, metadata: RunMetadata) => void;
  setText: (chatId: string, text: string) => void;
  clear: (chatId: string) => void;
};

export const useLiveRunStore = create<LiveRunState>((set) => ({
  runs: {},

  start: (chatId) =>
    set((s) => ({
      runs: { ...s.runs, [chatId]: { status: "queued", text: "", thinkingStartedAt: new Date().toISOString() } },
    })),

  connect: (chatId, ids) => update(set, chatId, ids),

  fail: (chatId, message) =>
    update(set, chatId, { status: "failed", error: { code: "INTERNAL", message, retryable: true } }),

  setMetadata: (chatId, metadata) =>
    set((s) => {
      const run = s.runs[chatId];
      if (!run) return s;
      const patch = run.thinkingStartedAt ? { ...metadata, thinkingStartedAt: run.thinkingStartedAt } : metadata;
      return { runs: { ...s.runs, [chatId]: { ...run, ...patch } } };
    }),

  setText: (chatId, text) => update(set, chatId, { text }),

  clear: (chatId) =>
    set((s) => {
      if (!(chatId in s.runs)) return s;
      const runs = { ...s.runs };
      delete runs[chatId];
      return { runs };
    }),
}));

function update(set: (fn: (s: LiveRunState) => Partial<LiveRunState>) => void, chatId: string, patch: Partial<LiveRun>) {
  set((s) => {
    const run = s.runs[chatId];
    return run ? { runs: { ...s.runs, [chatId]: { ...run, ...patch } } } : s;
  });
}
