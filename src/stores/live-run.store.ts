import { create } from "zustand";
import type { SafeError } from "@/contracts/errors";
import type { RunMetadata } from "@/contracts/run";

export type LiveRun = {
  runId: string;
  accessToken: string;
  status: RunMetadata["status"];
  text: string;
  thinkingStartedAt?: string;
  error?: SafeError;
};

type LiveRunState = {
  runs: Record<string, LiveRun>; // keyed by chatId
  start: (chatId: string, run: { runId: string; accessToken: string }) => void;
  setMetadata: (chatId: string, metadata: RunMetadata) => void;
  setText: (chatId: string, text: string) => void;
  clear: (chatId: string) => void;
};

export const useLiveRunStore = create<LiveRunState>((set) => ({
  runs: {},

  start: (chatId, run) =>
    set((s) => ({
      runs: {
        ...s.runs,
        [chatId]: { ...run, status: "thinking", text: "", thinkingStartedAt: new Date().toISOString() },
      },
    })),

  setMetadata: (chatId, metadata) =>
    set((s) => {
      const run = s.runs[chatId];
      if (!run) return s;
      return { runs: { ...s.runs, [chatId]: { ...run, ...metadata } } };
    }),

  setText: (chatId, text) =>
    set((s) => {
      const run = s.runs[chatId];
      if (!run) return s;
      return { runs: { ...s.runs, [chatId]: { ...run, text } } };
    }),

  clear: (chatId) =>
    set((s) => {
      if (!(chatId in s.runs)) return s;
      const runs = { ...s.runs };
      delete runs[chatId];
      return { runs };
    }),
}));
