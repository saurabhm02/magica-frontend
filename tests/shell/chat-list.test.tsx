import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatList } from "@/components/shell/chat-list";
import { useLiveRunStore } from "@/stores/live-run.store";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const now = new Date().toISOString();
const url = "http://localhost:4000/api/v1/chats";

beforeEach(() => {
  useLiveRunStore.setState({ runs: {} });
});

function renderChatList() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <ChatList />
    </QueryClientProvider>,
  );
}

describe("ChatList", () => {
  it("shows the pinned section before recent chats", async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json({
          items: [
            { id: "1", title: "Pinned chat", pinned: true, createdAt: now, updatedAt: now },
            { id: "2", title: "Recent chat", pinned: false, createdAt: now, updatedAt: now },
          ],
          nextCursor: null,
        }),
      ),
    );

    renderChatList();

    const pinnedLink = await screen.findByRole("link", { name: "Pinned chat" });
    const recentLink = screen.getByRole("link", { name: "Recent chat" });
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    expect(pinnedLink.compareDocumentPosition(recentLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the empty state when there are no chats", async () => {
    server.use(http.get(url, () => HttpResponse.json({ items: [], nextCursor: null })));

    renderChatList();

    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
  });

  it("shows a spinner on a chat row while its run is active", async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json({
          items: [
            { id: "1", title: "Running chat", pinned: false, createdAt: now, updatedAt: now },
            { id: "2", title: "Idle chat", pinned: false, createdAt: now, updatedAt: now },
          ],
          nextCursor: null,
        }),
      ),
    );
    useLiveRunStore.setState({
      runs: { "1": { status: "working", text: "" }, "2": { status: "complete", text: "" } },
    });

    renderChatList();

    const runningLink = await screen.findByRole("link", { name: /Running chat/ });
    const idleLink = screen.getByRole("link", { name: "Idle chat" });
    expect(within(runningLink).getByLabelText("Run in progress")).toBeInTheDocument();
    expect(within(idleLink).queryByLabelText("Run in progress")).not.toBeInTheDocument();
  });
});
