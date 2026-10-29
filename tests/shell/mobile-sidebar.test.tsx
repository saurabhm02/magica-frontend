import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileSidebar } from "@/components/shell/mobile-sidebar";
import { useUiStore } from "@/stores/ui.store";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }), useAuth: () => ({ getToken: async () => "token" }), useClerk: () => ({ signOut: vi.fn() }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/" }));

beforeEach(() => {
  useUiStore.setState({ sidebarCollapsed: false, mobileDrawerOpen: false });
  server.use(
    http.get("http://localhost:4000/api/v1/chats", () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get("http://localhost:4000/api/v1/me/credits", () => HttpResponse.json({ balance: 29_010_000 })),
  );
});

function renderMobileSidebar() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MobileSidebar />
    </QueryClientProvider>,
  );
}

describe("MobileSidebar", () => {
  it("opens on trigger click and closes on Escape", async () => {
    renderMobileSidebar();

    expect(screen.queryByRole("link", { name: "New task" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
    expect(await screen.findByRole("link", { name: "New task" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await screen.findByRole("button", { name: "Open sidebar" });
    expect(screen.queryByRole("link", { name: "New task" })).not.toBeInTheDocument();
  });
});
