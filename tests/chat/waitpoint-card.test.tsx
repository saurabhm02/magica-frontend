import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatView } from "@/components/chat/chat-view";
import { useLiveRunStore } from "@/stores/live-run.store";
import { emitMetadata, resetRealtimeMock } from "../mocks/trigger-realtime";
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
const respondUrl = `http://localhost:4000/api/v1/chats/${chatId}/waitpoints/wp1/respond`;
const now = new Date().toISOString();

const choiceQuestion = {
  id: "q1",
  question: "Which logo style do you want?",
  type: "choice",
  options: [
    { id: "minimal_modern", label: "Minimal & modern", description: "Clean and geometric.", recommended: true },
    { id: "vintage_badge", label: "Vintage badge", description: "A round emblem." },
  ],
  allowOther: true,
};

const textQuestion = {
  id: "q2",
  question: "What is your coffee shop's name?",
  type: "text",
  placeholder: "Type your shop's name…",
};

function waitpointMetadata(overrides: Partial<{ questions: unknown[]; expiresAt: string }> = {}) {
  return {
    status: "waiting",
    thinkingStartedAt: now,
    waitpoint: {
      id: "wp1",
      type: "options",
      message: "Pick a style",
      questions: overrides.questions ?? [choiceQuestion, textQuestion],
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000).toISOString(),
    },
  };
}

function fakeServer(activeRun: Record<string, unknown> | null = null) {
  server.use(
    http.get(activeRunUrl, () => HttpResponse.json(activeRun)),
    http.get(messagesUrl, () => HttpResponse.json({ items: [], nextCursor: null })),
  );
}

function renderChatView() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <ChatView chatId={chatId} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useLiveRunStore.setState({ runs: {} });
  resetRealtimeMock();
});

describe("WaitpointCard", () => {
  it("renders from run metadata, replacing the composer", async () => {
    fakeServer();
    renderChatView();
    await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));
    useLiveRunStore.getState().start(chatId);
    useLiveRunStore.getState().connect(chatId, { triggerRunId: "run_trigger1", accessToken: "tok" });

    await act(async () => emitMetadata("run_trigger1", waitpointMetadata()));

    expect(await screen.findByText("Which logo style do you want?")).toBeInTheDocument();
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Send a message...")).not.toBeInTheDocument();
  });

  it("supports ↑ ↓ Enter to select an option, and Esc to skip all", async () => {
    fakeServer();
    let posted: unknown;
    server.use(
      http.post(respondUrl, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ id: "wp1", status: "skipped", answers: [] });
      }),
    );

    renderChatView();
    await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));
    useLiveRunStore.getState().start(chatId);
    useLiveRunStore.getState().connect(chatId, { triggerRunId: "run_trigger1", accessToken: "tok" });
    await act(async () => emitMetadata("run_trigger1", waitpointMetadata({ questions: [choiceQuestion] })));
    await screen.findByText("Which logo style do you want?");

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowDown" });
    fireEvent.keyDown(group, { key: "Enter" });

    await waitFor(() => expect(posted).toEqual({ answers: [{ questionId: "q1", question: choiceQuestion.question, answer: "vintage_badge" }] }));

    // A fresh waitpoint, then Escape skips everything.
    posted = undefined;
    await act(async () => emitMetadata("run_trigger1", waitpointMetadata({ questions: [choiceQuestion] })));
    await screen.findByText("Which logo style do you want?");
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "Escape" });

    await waitFor(() => expect(posted).toEqual({ skip: true }));
  });

  it("submits all answers exactly once on the last question", async () => {
    fakeServer();
    let postCount = 0;
    let posted: unknown;
    server.use(
      http.post(respondUrl, async ({ request }) => {
        postCount += 1;
        posted = await request.json();
        return HttpResponse.json({ id: "wp1", status: "answered", answers: [] });
      }),
    );

    renderChatView();
    await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));
    useLiveRunStore.getState().start(chatId);
    useLiveRunStore.getState().connect(chatId, { triggerRunId: "run_trigger1", accessToken: "tok" });
    await act(async () => emitMetadata("run_trigger1", waitpointMetadata()));
    await screen.findByText("Which logo style do you want?");

    fireEvent.click(screen.getByText("Minimal & modern"));

    await screen.findByText("What is your coffee shop's name?");
    fireEvent.change(screen.getByPlaceholderText("Type your shop's name…"), { target: { value: "Saurabh's" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(postCount).toBe(1));
    expect(posted).toEqual({
      answers: [
        { questionId: "q1", question: choiceQuestion.question, answer: "minimal_modern" },
        { questionId: "q2", question: textQuestion.question, answer: "Saurabh's" },
      ],
    });
  });

  it("reload shows the card from active-run's pending waitpoint", async () => {
    fakeServer({
      runId: "db-run-1",
      triggerRunId: "run_trigger1",
      accessToken: "tok",
      status: "waiting",
      waitpoint: {
        id: "wp1",
        type: "options",
        status: "pending",
        message: "Pick a style",
        questions: [choiceQuestion],
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });

    renderChatView();

    expect(await screen.findByText("Which logo style do you want?")).toBeInTheDocument();
  });

  it("clears the card once its waitpoint has expired", async () => {
    fakeServer();
    renderChatView();
    await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));
    useLiveRunStore.getState().start(chatId);
    useLiveRunStore.getState().connect(chatId, { triggerRunId: "run_trigger1", accessToken: "tok" });

    await act(async () =>
      emitMetadata("run_trigger1", waitpointMetadata({ expiresAt: new Date(Date.now() - 1000).toISOString() })),
    );

    await waitFor(() => expect(screen.queryByText("Which logo style do you want?")).not.toBeInTheDocument());
    expect(screen.getByPlaceholderText("Send a message...")).toBeInTheDocument();
  });
});
