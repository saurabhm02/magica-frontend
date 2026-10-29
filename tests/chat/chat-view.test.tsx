import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatView } from "@/components/chat/chat-view";
import type { Message } from "@/contracts/message";
import { useLiveRunStore } from "@/stores/live-run.store";
import { emitMetadata, emitTextPart, resetRealtimeMock } from "../mocks/trigger-realtime";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@trigger.dev/react-hooks", async () => {
  const mock = await import("../mocks/trigger-realtime");
  return { useRealtimeRun: mock.useRealtimeRun, useRealtimeStream: mock.useRealtimeStream };
});

const chatId = "c1";
const messagesUrl = `http://localhost:4000/api/v1/chats/${chatId}/messages`;
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
  return { textarea: screen.getByPlaceholderText("Assign a task or ask anything...") };
}

async function send(textarea: HTMLElement, text: string) {
  await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.keyDown(textarea, { key: "Enter" });
  await waitFor(() => expect(textarea).toHaveValue(""));
}

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
    server.use(http.get(messagesUrl, () => HttpResponse.json({ items: [], nextCursor: null })));
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
      expect(await screen.findByText(/Thinking/)).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000);
      });
      expect(screen.getByText("Thinking… 4s")).toBeInTheDocument();

      const later = new Date(Date.now() + 10000).toISOString();
      await act(async () => {
        emitMetadata("run_trigger1", { status: "thinking", thinkingStartedAt: later });
      });

      expect(screen.getByText("Thinking… 4s")).toBeInTheDocument();
      expect(screen.queryByText("Thinking… 0s")).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(screen.getByText("Thinking… 7s")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
