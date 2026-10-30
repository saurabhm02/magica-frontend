import { vi } from "vitest";

type Listener = (...args: unknown[]) => void;
type FakeFile = { id: string; name: string; type: string; size: number };

export type FakeUppy = {
  use: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  retryUpload: ReturnType<typeof vi.fn>;
  getFiles: () => FakeFile[];
  getFile: (id: string) => FakeFile | undefined;
  addFile: (file: File) => string;
  removeFile: (id: string) => void;
  on: (event: string, fn: Listener) => void;
  off: (event: string, fn: Listener) => void;
  emit: (event: string, ...args: unknown[]) => void;
};

let lastUppy: FakeUppy | null = null;
let nextId = 0;

function createFakeUppy(): FakeUppy {
  const listeners = new Map<string, Set<Listener>>();
  const files = new Map<string, FakeFile>();

  return {
    use: vi.fn(),
    destroy: vi.fn(),
    retryUpload: vi.fn(),
    getFiles: () => Array.from(files.values()),
    getFile: (id) => files.get(id),
    addFile: (file: File) => {
      const id = `file-${nextId++}`;
      files.set(id, { id, name: file.name, type: file.type, size: file.size });
      return id;
    },
    removeFile: (id) => files.delete(id),
    on: (event, fn) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(fn);
    },
    off: (event, fn) => listeners.get(event)?.delete(fn),
    emit: (event, ...args) => listeners.get(event)?.forEach((fn) => fn(...args)),
  };
}

export function resetUppyMock() {
  lastUppy = null;
  nextId = 0;
}

export function getLastUppy(): FakeUppy {
  if (!lastUppy) throw new Error("No Uppy instance was created yet");
  return lastUppy;
}

export function MockUppy() {
  lastUppy = createFakeUppy();
  return lastUppy;
}

export function MockTransloadit() {}
