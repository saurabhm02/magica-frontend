import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarFooter } from "@/components/shell/sidebar-footer";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: null }),
  useAuth: () => ({ getToken: async () => "token" }),
  useClerk: () => ({ signOut: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => {
  server.use(http.get("http://localhost:4000/api/v1/me/credits", () => HttpResponse.json({ balance: 25_540_000 })));
});

function renderFooter() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <SidebarFooter />
    </QueryClientProvider>,
  );
}

describe("SidebarFooter", () => {
  it("starts folded like Magica and toggles between More and Less", () => {
    renderFooter();

    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("button", { name: "Less" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Less" }));
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("marks look-only actions as not available", () => {
    renderFooter();
    fireEvent.click(screen.getByRole("button", { name: "More" }));

    expect(screen.getByRole("button", { name: /Add Credits/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: /Settings/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Invite team members" })).toHaveAttribute("aria-disabled", "true");
  });
});
