import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/shell/sidebar";
import { useUiStore } from "@/stores/ui.store";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }), useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => {
  useUiStore.setState({ sidebarCollapsed: false, mobileDrawerOpen: false });
  server.use(http.get("http://localhost:4000/api/v1/chats", () => HttpResponse.json({ items: [], nextCursor: null })));
});

function renderSidebar() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <Sidebar />
    </QueryClientProvider>,
  );
}

describe("Sidebar", () => {
  it("collapses to the icon rail and back", () => {
    renderSidebar();

    expect(screen.getByText("New task")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.queryByText("New task")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New task" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByText("New task")).toBeInTheDocument();
  });
});
