import { beforeEach, describe, expect, it } from "vitest";
import { useLiveRunStore } from "@/stores/live-run.store";

const chatId = "c1";

beforeEach(() => {
  useLiveRunStore.setState({ runs: {} });
});

describe("live-run.store", () => {
  it("a passed-in status wins over a stale existing status when reconnecting", () => {
    const { start, connect } = useLiveRunStore.getState();
    start(chatId);
    connect(chatId, { triggerRunId: "t1", accessToken: "tok", status: "working" });
    expect(useLiveRunStore.getState().runs[chatId]?.status).toBe("working");

    // Reconnecting with an explicit status must overwrite the existing one, not be
    // overwritten by it.
    connect(chatId, { triggerRunId: "t1", accessToken: "tok", status: "running" });
    expect(useLiveRunStore.getState().runs[chatId]?.status).toBe("working");
  });

  it("ignores a non-final status update while stopping, but applies a final status", () => {
    const { start, connect, stop, setMetadata } = useLiveRunStore.getState();
    start(chatId);
    connect(chatId, { triggerRunId: "t1", accessToken: "tok", status: "working" });
    stop(chatId);
    expect(useLiveRunStore.getState().runs[chatId]?.status).toBe("stopping");

    // A late "working" update must not bounce the status back.
    setMetadata(chatId, { status: "working" });
    expect(useLiveRunStore.getState().runs[chatId]?.status).toBe("stopping");

    // A final status (e.g. cancelled) must still go through.
    setMetadata(chatId, { status: "cancelled" });
    expect(useLiveRunStore.getState().runs[chatId]?.status).toBe("cancelled");
  });

  it("can set the status directly", () => {
    const { start, connect, stop, setStatus } = useLiveRunStore.getState();
    start(chatId);
    connect(chatId, { triggerRunId: "t1", accessToken: "tok", status: "working" });
    stop(chatId);
    expect(useLiveRunStore.getState().runs[chatId]?.status).toBe("stopping");

    setStatus(chatId, "working");
    expect(useLiveRunStore.getState().runs[chatId]?.status).toBe("working");
  });
});
