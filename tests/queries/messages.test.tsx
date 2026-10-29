import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useSendMessage } from "@/queries/messages";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const url = "http://localhost:4000/api/v1/chats/c1/messages";

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Every send fails, so the hook keeps its last attempt; we record the ids it sent.
function recordFailingSends() {
  const ids: string[] = [];
  server.use(
    http.post(url, async ({ request }) => {
      ids.push(((await request.json()) as { clientRequestId: string }).clientRequestId);
      return HttpResponse.json(
        { error: { code: "INTERNAL", message: "Something went wrong", retryable: true, traceId: "t" } },
        { status: 500 },
      );
    }),
  );
  return ids;
}

describe("useSendMessage", () => {
  it("reuses the clientRequestId when retrying the same text in the same chat", async () => {
    const ids = recordFailingSends();
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    await result.current.mutateAsync({ chatId: "c1", content: "hello", planMode: false }).catch(() => {});
    await result.current.mutateAsync({ chatId: "c1", content: "hello", planMode: false }).catch(() => {});

    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  it("uses a new clientRequestId when the text changes after a failure", async () => {
    const ids = recordFailingSends();
    const { result } = renderHook(() => useSendMessage(), { wrapper });

    await result.current.mutateAsync({ chatId: "c1", content: "hello", planMode: false }).catch(() => {});
    await result.current.mutateAsync({ chatId: "c1", content: "something else", planMode: false }).catch(() => {});

    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
