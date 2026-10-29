import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

afterEach(cleanup);

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

Object.defineProperty(global, "ResizeObserver", {
  writable: true,
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

Object.defineProperty(global, "requestAnimationFrame", {
  writable: true,
  value: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
});
Object.defineProperty(global, "cancelAnimationFrame", {
  writable: true,
  value: (id: number) => clearTimeout(id),
});
