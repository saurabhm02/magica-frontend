import { useSyncExternalStore } from "react";

const EMPTY_PARTS: string[] = [];

const metadataByRun = new Map<string, Record<string, unknown>>();
const partsByRun = new Map<string, string[]>();
const errorByRun = new Map<string, Error>();
const finishedByRun = new Set<string>();
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
  errorByRun.clear();
  finishedByRun.clear();
}

export function emitMetadata(runId: string, metadata: Record<string, unknown>) {
  metadataByRun.set(runId, metadata);
  notify();
}

export function emitTextPart(runId: string, chunk: string) {
  partsByRun.set(runId, [...(partsByRun.get(runId) ?? []), chunk]);
  notify();
}

export function emitError(runId: string, error: Error) {
  errorByRun.set(runId, error);
  notify();
}

export function emitFinished(runId: string) {
  finishedByRun.add(runId);
  notify();
}

// Matches the real hook: disabled only when `enabled` is explicitly false.
function isEnabled(options?: { enabled?: boolean }) {
  return options?.enabled !== false;
}

export function useRealtimeRun(runId?: string, options?: { enabled?: boolean }) {
  const metadata = useSyncExternalStore(subscribe, () => (runId ? metadataByRun.get(runId) : undefined));
  const finished = useSyncExternalStore(subscribe, () => (runId ? finishedByRun.has(runId) : false));
  const error = useSyncExternalStore(subscribe, () => (runId ? errorByRun.get(runId) : undefined));
  if (!isEnabled(options) || !runId) return { run: undefined, error: undefined };
  if (!metadata && !finished) return { run: undefined, error };
  return { run: { id: runId, metadata, finishedAt: finished ? new Date().toISOString() : undefined }, error };
}

export function useRealtimeStream(runId?: string, _streamKey?: string, options?: { enabled?: boolean }) {
  const parts = useSyncExternalStore(subscribe, () => (runId ? (partsByRun.get(runId) ?? EMPTY_PARTS) : EMPTY_PARTS));
  const error = useSyncExternalStore(subscribe, () => (runId ? errorByRun.get(runId) : undefined));
  if (!isEnabled(options) || !runId) return { parts: EMPTY_PARTS, error: undefined };
  return { parts, error };
}
