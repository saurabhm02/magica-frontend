import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useChats } from "@/queries/chats";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const now = new Date().toISOString();
const url = "http://localhost:4000/api/v1/chats";

function chat(id: string) {
  return { id, title: `Chat ${id}`, pinned: false, createdAt: now, updatedAt: now };
}

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useChats", () => {
  it("pages across two cursor pages", async () => {
    server.use(
      http.get(url, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        return HttpResponse.json(
          cursor ? { items: [chat("2")], nextCursor: null } : { items: [chat("1")], nextCursor: "page-2" },
        );
      }),
    );

    const { result } = renderHook(() => useChats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages.flatMap((p) => p.items).map((c) => c.id)).toEqual(["1", "2"]);
    expect(result.current.hasNextPage).toBe(false);
  });
});
