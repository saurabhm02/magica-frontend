import { useSyncExternalStore } from "react";

const EMPTY_PARTS: string[] = [];

const metadataByRun = new Map<string, Record<string, unknown>>();
const partsByRun = new Map<string, string[]>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function resetRealtimeMock() {
  metadataByRun.clear();
  partsByRun.clear();
}

export function emitMetadata(runId: string, metadata: Record<string, unknown>) {
  metadataByRun.set(runId, metadata);
  notify();
}

export function emitTextPart(runId: string, chunk: string) {
  partsByRun.set(runId, [...(partsByRun.get(runId) ?? []), chunk]);
  notify();
}

export function useRealtimeRun(runId?: string, options?: { enabled?: boolean }) {
  const metadata = useSyncExternalStore(subscribe, () => (runId ? metadataByRun.get(runId) : undefined));
  if (!options?.enabled || !runId) return { run: undefined, error: undefined };
  return { run: metadata ? { id: runId, metadata } : undefined, error: undefined };
}

export function useRealtimeStream(runId?: string, _streamKey?: string, options?: { enabled?: boolean }) {
  const parts = useSyncExternalStore(subscribe, () => (runId ? (partsByRun.get(runId) ?? EMPTY_PARTS) : EMPTY_PARTS));
  if (!options?.enabled || !runId) return { parts: EMPTY_PARTS, error: undefined };
  return { parts, error: undefined };
}
