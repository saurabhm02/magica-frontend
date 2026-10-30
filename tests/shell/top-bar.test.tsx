import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopBar } from "@/components/shell/top-bar";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }), useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/" }));

beforeEach(() => {
  server.use(http.get("http://localhost:4000/api/v1/me/credits", () => HttpResponse.json({ balance: 25_540_000 })));
});

function renderTopBar() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <TopBar />
    </QueryClientProvider>,
  );
}

describe("TopBar credits popover", () => {
  it("opens the popover from the credits pill and closes on Escape", async () => {
    renderTopBar();

    const pill = await screen.findByTestId("top-bar-credits");
    fireEvent.click(pill);
    expect(await screen.findByRole("dialog", { name: "Credits" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Credits" })).not.toBeInTheDocument();
  });
});
