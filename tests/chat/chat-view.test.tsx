import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatView } from "@/components/chat/chat-view";
import type { Message } from "@/contracts/message";
import { useLiveRunStore } from "@/stores/live-run.store";
import { emitError, emitFinished, emitMetadata, emitTextPart, resetRealtimeMock } from "../mocks/trigger-realtime";
import { queryKeys } from "@/queries/keys";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@trigger.dev/react-hooks", async () => {
  const mock = await import("../mocks/trigger-realtime");
  return { useRealtimeRun: mock.useRealtimeRun, useRealtimeStream: mock.useRealtimeStream };
});

const chatId = "c1";
const messagesUrl = `http://localhost:4000/api/v1/chats/${chatId}/messages`;
const activeRunUrl = `http://localhost:4000/api/v1/chats/${chatId}/active-run`;
const cancelUrl = `http://localhost:4000/api/v1/chats/${chatId}/runs/db-run-1/cancel`;
const now = new Date().toISOString();

beforeEach(() => {
  useLiveRunStore.setState({ runs: {} });
  resetRealtimeMock();
});

function message(partial: Partial<Message> & Pick<Message, "id" | "role" | "status" | "content">): Message {
  return { chatId, clientRequestId: null, createdAt: now, updatedAt: now, ...partial };
}

// Backs GET/POST with an in-memory, newest-first list, like the real server:
// sending a message saves it right away, so the post-send refetch finds it.
function fakeServer(initial: Message[] = []) {
  const items = [...initial];
  server.use(
    http.get(activeRunUrl, () => HttpResponse.json(null)),
    http.post(cancelUrl, () => HttpResponse.json({ runId: "db-run-1", status: "cancelled" })),
    http.get(messagesUrl, () => HttpResponse.json({ items, nextCursor: null })),
    http.post(messagesUrl, () => {
      items.unshift(message({ id: "m-user", role: "user", status: "complete", content: [{ type: "text", text: "hello" }] }));
      return HttpResponse.json(
        { chatId, messageId: "m-user", runId: "db-run-1", realtime: { runId: "run_trigger1", accessToken: "tok" } },
        { status: 201 },
      );
    }),
  );
  return items;
}

function renderChatView() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <ChatView chatId={chatId} />
    </QueryClientProvider>,
  );
  return { textarea: screen.getByPlaceholderText("Send a message..."), queryClient };
}

async function send(textarea: HTMLElement, text: string) {
  await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.keyDown(textarea, { key: "Enter" });
  await waitFor(() => expect(textarea).toHaveValue(""));
}

// A running tool step, so the live header shows "<label> <seconds>s".
const TOOL = (startedAt: string) => ({
  id: "t1",
  name: "gpt_image_2",
  status: "running" as const,
  startedAt,
  renderKey: "image-result",
  label: "Generating image",
});

describe("ChatView", () => {
  it("shows the reply exactly once after it streams and completes", async () => {
    const items = fakeServer();
    const { textarea } = renderChatView();

    await send(textarea, "hello");
    expect(await screen.findByText("hello")).toBeInTheDocument();

    await act(async () => emitMetadata("run_trigger1", { status: "thinking", thinkingStartedAt: now }));
    await screen.findByText(/Thinking/);

    await act(async () => {
      emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now });
      emitTextPart("run_trigger1", "Hi there");
    });
    await screen.findByText("Hi there");

    // The server saves the reply as it streams; by "complete" it's in the saved list too.
    items.unshift(message({ id: "m-assistant", role: "assistant", status: "complete", content: [{ type: "text", text: "Hi there" }] }));
    await act(async () => emitMetadata("run_trigger1", { status: "complete", thinkingStartedAt: now }));

    await waitFor(() => expect(screen.queryByText(/Thinking/)).not.toBeInTheDocument());
    expect(screen.getAllByText("Hi there")).toHaveLength(1);
  });

  it("shows the saved partial reply once, marked failed, with Retry", async () => {
    const items = fakeServer();
    const { textarea } = renderChatView();

    await send(textarea, "hello");

    await act(async () => {
      emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now });
      emitTextPart("run_trigger1", "partial");
    });
    await screen.findByText("partial");

    items.unshift(message({ id: "m-assistant", role: "assistant", status: "failed", content: [{ type: "text", text: "partial" }] }));
    await act(async () =>
      emitMetadata("run_trigger1", {
        status: "failed",
        thinkingStartedAt: now,
        error: { code: "LLM_UNAVAILABLE", message: "The model is unavailable right now.", retryable: true },
      }),
    );

    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getAllByText("partial")).toHaveLength(1);
    expect(screen.getByText("This reply failed.")).toBeInTheDocument();
  });

  it("shows the 409 message and keeps the composer text", async () => {
    server.use(
      http.get(activeRunUrl, () => HttpResponse.json(null)),
      http.get(messagesUrl, () => HttpResponse.json({ items: [], nextCursor: null })),
    );
    server.use(
      http.post(messagesUrl, () =>
        HttpResponse.json(
          { error: { code: "RUN_ALREADY_ACTIVE", message: "A reply is already in progress in this chat.", retryable: false, traceId: "t" } },
          { status: 409 },
        ),
      ),
    );
    const { textarea } = renderChatView();
    await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));

    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(await screen.findByText("A reply is already in progress in this chat.")).toBeInTheDocument();
    expect(textarea).toHaveValue("hello");
  });

  it("keeps the thinking timer continuous when server metadata arrives with a later timestamp", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      fakeServer();
      const { textarea } = renderChatView();
      await send(textarea, "hello");
      expect(await screen.findByText("Thinking")).toBeInTheDocument();

      const firstStart = new Date().toISOString();
      await act(async () => {
        emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: firstStart, tools: [TOOL(firstStart)] });
        await vi.advanceTimersByTimeAsync(4000);
      });
      expect(screen.getByText("Generating image 4s")).toBeInTheDocument();

      const later = new Date(Date.now() + 10000).toISOString();
      await act(async () => {
        emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: later, tools: [TOOL(firstStart)] });
      });

      expect(screen.getByText("Generating image 4s")).toBeInTheDocument();
      expect(screen.queryByText("Generating image 0s")).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(screen.getByText("Generating image 7s")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("reload mid-run reconnects and the timer doesn't reset", async () => {
    // 5 seconds ago
    const startedAt = new Date(Date.now() - 5000).toISOString();
    server.use(
      http.get(activeRunUrl, () =>
        HttpResponse.json({
          runId: "db-run-1",
          triggerRunId: "run_trigger1",
          accessToken: "tok",
          status: "running",
        }),
      ),
      http.get(messagesUrl, () => HttpResponse.json({ items: [], nextCursor: null })),
    );

    emitMetadata("run_trigger1", {
      status: "working",
      thinkingStartedAt: startedAt,
      tools: [TOOL(startedAt)],
    });

    renderChatView();

    // Reconnected to live run and timer is at least 5s (not 0s)
    const workingText = await screen.findByText(/Generating image [5-9]s/);
    expect(workingText).toBeInTheDocument();
    expect(screen.queryByText("Generating image 0s")).not.toBeInTheDocument();
  });

  it("stopping a run shows the interrupted card with a Retry button, and the composer is usable right away", async () => {
    const items = fakeServer();
    let cancelled = false;
    server.use(
      http.post(cancelUrl, () => {
        cancelled = true;
        return HttpResponse.json({ runId: "db-run-1", status: "cancelled" });
      }),
    );

    const { textarea } = renderChatView();
    await send(textarea, "hello");

    await act(async () => {
      emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now });
      emitTextPart("run_trigger1", "Some partial text");
    });

    expect(await screen.findByText("Some partial text")).toBeInTheDocument();
    const stopBtn = screen.getByRole("button", { name: "Stop" });
    expect(stopBtn).toBeInTheDocument();

    // The server saves the cancelled reply as soon as the cancel request lands.
    items.unshift(
      message({
        id: "m-assistant",
        role: "assistant",
        status: "cancelled",
        content: [{ type: "text", text: "Some partial text" }],
      }),
    );

    await act(async () => {
      fireEvent.click(stopBtn);
    });

    expect(cancelled).toBe(true);
    expect(await screen.findByText("Response was interrupted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getAllByText("Some partial text")).toHaveLength(1);

    // Composer is usable right away
    expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
  });

  it("a failed cancel request goes back to the working status and shows an inline error", async () => {
    fakeServer();
    server.use(http.post(cancelUrl, () => HttpResponse.json({ error: { code: "INTERNAL", message: "boom", retryable: true, traceId: "t" } }, { status: 500 })));

    const { textarea } = renderChatView();
    await send(textarea, "hello");

    await act(async () => {
      emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now });
      emitTextPart("run_trigger1", "Some partial text");
    });

    const stopBtn = screen.getByRole("button", { name: "Stop" });
    await act(async () => fireEvent.click(stopBtn));

    expect(await screen.findByText("Couldn't stop. Try again.")).toBeInTheDocument();
    // Back to the active state (no tool steps, so "Thinking"); Stop is still shown
    expect(screen.getByText("Thinking")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });

  it("a realtime error refetches messages and clears the live bubble once the run is gone", async () => {
    const items = fakeServer();
    const { textarea } = renderChatView();
    await send(textarea, "hello");

    await act(async () => {
      emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now });
      emitTextPart("run_trigger1", "streaming text");
    });
    expect(await screen.findByText("streaming text")).toBeInTheDocument();

    // The server already finished and saved the reply by the time we notice the drop.
    items.unshift(
      message({
        id: "m-assistant",
        role: "assistant",
        status: "complete",
        content: [{ type: "text", text: "streaming text" }],
      }),
    );

    // Simulate realtime error (connection drop). active-run already returns null (fakeServer
    // default), so the very first poll finds the run is gone and finalizes right away.
    await act(async () => {
      emitError("run_trigger1", new Error("SSE connection dropped"));
    });

    await waitFor(() => expect(screen.queryByText(/Working|Thinking/)).not.toBeInTheDocument());
    expect(screen.getAllByText("streaming text")).toHaveLength(1);
  });

  it("a realtime error resubscribes and keeps receiving live updates while the run is still active", async () => {
    const items = fakeServer();
    const { textarea } = renderChatView();
    await send(textarea, "hello");

    await act(async () => {
      emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now });
      emitTextPart("run_trigger1", "streaming text");
    });
    expect(await screen.findByText("streaming text")).toBeInTheDocument();

    // Only once the connection actually drops does active-run start reporting the (new) run.
    server.use(
      http.get(activeRunUrl, () =>
        HttpResponse.json({ runId: "db-run-1", triggerRunId: "run_trigger2", accessToken: "tok2", status: "running" }),
      ),
    );
    await act(async () => emitError("run_trigger1", new Error("SSE connection dropped")));

    // Resubscribed to the run active-run reported, and receives its live updates
    await act(async () => {
      emitMetadata("run_trigger2", { status: "working", thinkingStartedAt: now });
      emitTextPart("run_trigger2", "resumed text");
    });
    expect(await screen.findByText("resumed text")).toBeInTheDocument();

    items.unshift(
      message({
        id: "m-assistant",
        role: "assistant",
        status: "complete",
        content: [{ type: "text", text: "resumed text" }],
      }),
    );
    server.use(http.get(activeRunUrl, () => HttpResponse.json(null)));
    await act(async () => emitMetadata("run_trigger2", { status: "complete", thinkingStartedAt: now }));
    await waitFor(() => expect(screen.queryByText(/Working/)).not.toBeInTheDocument());
  });

  it("never reconnects to a triggerRunId that already finalized", async () => {
    const items = fakeServer();
    const { textarea } = renderChatView();
    await send(textarea, "hello");

    await act(async () => emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now }));

    items.unshift(
      message({ id: "m-assistant", role: "assistant", status: "complete", content: [{ type: "text", text: "done" }] }),
    );
    await act(async () => emitMetadata("run_trigger1", { status: "complete", thinkingStartedAt: now }));
    await waitFor(() => expect(screen.queryByText(/Thinking|Working/)).not.toBeInTheDocument());

    // A stray late error on the already-finalized run must not resurrect the live bubble
    await act(async () => emitError("run_trigger1", new Error("late error")));
    expect(screen.queryByText("Reconnecting…")).not.toBeInTheDocument();
  });

  it("doesn't reconnect right after a run finalizes", async () => {
    const items = fakeServer();
    const { textarea } = renderChatView();
    await send(textarea, "hello");

    await act(async () => emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now }));

    items.unshift(
      message({ id: "m-assistant", role: "assistant", status: "complete", content: [{ type: "text", text: "done" }] }),
    );
    await act(async () => emitMetadata("run_trigger1", { status: "complete", thinkingStartedAt: now }));

    await waitFor(() => expect(useLiveRunStore.getState().runs[chatId]).toBeUndefined());
    // If the active-run cache hadn't been cleared before clear(), reload-recovery would
    // reconnect right here and show Thinking/Working again.
    expect(screen.queryByText(/Thinking|Working/)).not.toBeInTheDocument();
  });

  it("renames the chat in the sidebar cache as soon as metadata reports a title", async () => {
    fakeServer();
    const { textarea, queryClient } = renderChatView();
    queryClient.setQueryData(queryKeys.chats, {
      pages: [{ items: [{ id: chatId, title: "New chat", pinned: false, createdAt: now, updatedAt: now }], nextCursor: null }],
      pageParams: [undefined],
    });
    await send(textarea, "hello");

    await act(async () => emitMetadata("run_trigger1", { status: "working", thinkingStartedAt: now, chatTitle: "Coffee mug photo" }));

    const cached = queryClient.getQueryData(queryKeys.chats) as { pages: { items: { id: string; title: string }[] }[] };
    expect(cached.pages[0]?.items[0]?.title).toBe("Coffee mug photo");
  });

  it("shows the saved suggestion as a chip and sends it on click", async () => {
    const items = fakeServer();
    items.unshift(
      message({
        id: "m-assistant",
        role: "assistant",
        status: "complete",
        content: [{ type: "text", text: "Here's your photo" }],
        suggestion: "try a lifestyle setting",
      }),
    );
    let postedContent: string | undefined;
    server.use(
      http.post(messagesUrl, async ({ request }) => {
        const body = (await request.json()) as { content: string };
        postedContent = body.content;
        return HttpResponse.json(
          { chatId, messageId: "m-user-2", runId: "db-run-2", realtime: { runId: "run_trigger2", accessToken: "tok" } },
          { status: 201 },
        );
      }),
    );

    renderChatView();
    const chip = await screen.findByRole("button", { name: "try a lifestyle setting" });
    expect(screen.getByText("Suggested")).toBeInTheDocument();

    fireEvent.click(chip);
    await waitFor(() => expect(postedContent).toBe("try a lifestyle setting"));
  });

  it("hides the suggestion chip while a run is active", async () => {
    const items = fakeServer();
    items.unshift(
      message({
        id: "m-assistant",
        role: "assistant",
        status: "complete",
        content: [{ type: "text", text: "Here's your photo" }],
        suggestion: "try a lifestyle setting",
      }),
    );

    const { textarea } = renderChatView();
    await screen.findByText("try a lifestyle setting");

    fireEvent.change(textarea, { target: { value: "one more thing" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => expect(textarea).toHaveValue(""));
    expect(screen.queryByText("try a lifestyle setting")).not.toBeInTheDocument();
  });

  it("refetches messages once more when the trigger run finishes after it's already marked complete", async () => {
    let getCount = 0;
    const items = fakeServer();
    server.use(
      http.get(messagesUrl, () => {
        getCount += 1;
        return HttpResponse.json({ items, nextCursor: null });
      }),
    );

    const { textarea } = renderChatView();
    await send(textarea, "hello");

    items.unshift(
      message({ id: "m-assistant", role: "assistant", status: "complete", content: [{ type: "text", text: "done" }] }),
    );
    await act(async () => emitMetadata("run_trigger1", { status: "complete", thinkingStartedAt: now }));
    await waitFor(() => expect(useLiveRunStore.getState().runs[chatId]).toBeUndefined());

    const countAtComplete = getCount;
    await act(async () => emitFinished("run_trigger1"));
    await waitFor(() => expect(getCount).toBe(countAtComplete + 1));

    await act(async () => emitFinished("run_trigger1"));
    expect(getCount).toBe(countAtComplete + 1);
  });
});
