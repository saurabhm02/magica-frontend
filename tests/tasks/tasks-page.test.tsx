import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import TasksPage from "@/app/(app)/tasks/page";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const now = new Date().toISOString();
const url = "http://localhost:4000/api/v1/chats";

function renderTasksPage() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <TasksPage />
    </QueryClientProvider>,
  );
}

describe("TasksPage", () => {
  it("debounces the search box and calls the API with the query", async () => {
    const requestedQueries: (string | null)[] = [];
    server.use(
      http.get(url, ({ request }) => {
        requestedQueries.push(new URL(request.url).searchParams.get("q"));
        return HttpResponse.json({
          items: [{ id: "1", title: "Casual Greeting", pinned: false, createdAt: now, updatedAt: now }],
          nextCursor: null,
        });
      }),
    );

    renderTasksPage();
    await screen.findByText("Casual Greeting");

    // Type one letter at a time, faster than the debounce.
    const search = screen.getByPlaceholderText("Search tasks...");
    for (const value of ["g", "gr", "gre", "gree", "greet"]) {
      fireEvent.change(search, { target: { value } });
    }

    // The full suite runs many files at once, so allow more than the 1s default.
    await waitFor(() => expect(requestedQueries).toContain("greet"), { timeout: 3000 });
    expect(requestedQueries.filter((q) => q && q !== "greet")).toEqual([]);
  });
});
