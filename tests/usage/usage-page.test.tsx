import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsagePage from "@/app/(app)/usage/page";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const now = new Date().toISOString();

beforeEach(() => {
  server.use(
    http.get("http://localhost:4000/api/v1/me/credits/ledger", () =>
      HttpResponse.json({
        items: [
          { id: "1", type: "grant", amount: 25_000_000, balanceAfter: 25_000_000, createdAt: now },
          { id: "2", type: "settle", amount: -540_000, balanceAfter: 24_460_000, createdAt: now },
        ],
        nextCursor: null,
      }),
    ),
  );
});

function renderUsagePage() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <UsagePage />
    </QueryClientProvider>,
  );
}

describe("UsagePage", () => {
  it("renders the credit ledger", async () => {
    renderUsagePage();

    expect(await screen.findByText("Credit grant")).toBeInTheDocument();
    expect(screen.getByText("Charge")).toBeInTheDocument();
    expect(screen.getByText("+25.00M")).toBeInTheDocument();
    expect(screen.getByText("-0.54M")).toBeInTheDocument();
  });
});
