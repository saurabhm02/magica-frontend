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

const plan = {
  title: "Coffee Mug Product Photo + Instagram Story Crop",
  overview: "Create one product photo, then crop it for Stories.",
  steps: [
    { title: "Studio product photo of a coffee mug", description: "Generate a studio photo.", tool: "gpt_image_2", estimatedCredits: 140200 },
    { title: "Crop to Instagram Story (9:16)", description: "Crop to 9:16.", tool: "crop_image", estimatedCredits: 5000 },
  ],
  totalEstimatedCredits: 145200,
};

function planWaitpointMetadata() {
  return {
    status: "waiting",
    thinkingStartedAt: now,
    waitpoint: { id: "wp1", type: "plan", message: plan.overview, payload: plan, expiresAt: new Date(Date.now() + 60_000).toISOString() },
  };
}

function fakeServer() {
  server.use(
    http.get(activeRunUrl, () => HttpResponse.json(null)),
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

async function showPlanCard() {
  fakeServer();
  renderChatView();
  await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));
  useLiveRunStore.getState().start(chatId);
  useLiveRunStore.getState().connect(chatId, { triggerRunId: "run_trigger1", accessToken: "tok" });
  await act(async () => emitMetadata("run_trigger1", planWaitpointMetadata()));
  await screen.findByText(plan.title);
}

beforeEach(() => {
  useLiveRunStore.setState({ runs: {} });
  resetRealtimeMock();
});

describe("PlanCard", () => {
  it("renders the steps and the estimated total, and keeps the composer usable", async () => {
    await showPlanCard();

    expect(screen.getByText("Studio product photo of a coffee mug")).toBeInTheDocument();
    expect(screen.getByText("Crop to Instagram Story (9:16)")).toBeInTheDocument();
    expect(screen.getByText("~0.1452M credits")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Send a message...")).toBeInTheDocument();
  });

  it("Run All posts action: run_all exactly once, and Enter triggers it", async () => {
    let postCount = 0;
    let posted: unknown;
    server.use(
      http.post(respondUrl, async ({ request }) => {
        postCount += 1;
        posted = await request.json();
        return HttpResponse.json({ id: "wp1", status: "answered" });
      }),
    );
    await showPlanCard();

    fireEvent.keyDown(screen.getByTestId("plan-card"), { key: "Enter" });

    await waitFor(() => expect(postCount).toBe(1));
    expect(posted).toEqual({ action: "run_all" });
  });

  it("Step by Step posts action: step_by_step exactly once", async () => {
    let postCount = 0;
    let posted: unknown;
    server.use(
      http.post(respondUrl, async ({ request }) => {
        postCount += 1;
        posted = await request.json();
        return HttpResponse.json({ id: "wp1", status: "answered" });
      }),
    );
    await showPlanCard();

    fireEvent.click(screen.getByRole("button", { name: "Step by Step" }));

    await waitFor(() => expect(postCount).toBe(1));
    expect(posted).toEqual({ action: "step_by_step" });
  });

  it("Request Changes opens a text box and posts request_changes exactly once", async () => {
    let postCount = 0;
    let posted: unknown;
    server.use(
      http.post(respondUrl, async ({ request }) => {
        postCount += 1;
        posted = await request.json();
        return HttpResponse.json({ id: "wp1", status: "answered" });
      }),
    );
    await showPlanCard();

    fireEvent.click(screen.getByRole("button", { name: "Request Changes" }));
    const input = await screen.findByPlaceholderText("What would you like to change?");
    fireEvent.change(input, { target: { value: "Make it brighter" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(postCount).toBe(1));
    expect(posted).toEqual({ request_changes: "Make it brighter" });
  });
});

describe("PlanProgressCard", () => {
  it("updates its checklist live from run metadata", async () => {
    fakeServer();
    renderChatView();
    await waitForElementToBeRemoved(() => screen.queryByText("Loading…"));
    useLiveRunStore.getState().start(chatId);
    useLiveRunStore.getState().connect(chatId, { triggerRunId: "run_trigger1", accessToken: "tok" });

    await act(async () =>
      emitMetadata("run_trigger1", {
        status: "working",
        thinkingStartedAt: now,
        plan: {
          title: plan.title,
          shortTitle: "Coffee mug photo + Story crop",
          steps: [
            { title: "Studio product photo of a coffee mug", status: "running" },
            { title: "Crop to Instagram Story (9:16)", status: "pending" },
          ],
          done: 0,
          total: 2,
        },
      }),
    );

    expect(await screen.findByText("Coffee mug photo + Story crop")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();

    await act(async () =>
      emitMetadata("run_trigger1", {
        status: "working",
        thinkingStartedAt: now,
        plan: {
          title: plan.title,
          shortTitle: "Coffee mug photo + Story crop",
          steps: [
            { title: "Studio product photo of a coffee mug", status: "done" },
            { title: "Crop to Instagram Story (9:16)", status: "running" },
          ],
          done: 1,
          total: 2,
        },
      }),
    );

    expect(await screen.findByText("1/2")).toBeInTheDocument();
  });
});
