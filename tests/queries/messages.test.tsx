import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useMessages, useSendMessage } from "@/queries/messages";
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

describe("optimistic user message", () => {
  it("stays visible while the send is in flight, then is replaced by the saved one (no duplicate)", async () => {
    let saved: Record<string, unknown> | null = null;
    let releaseSend: () => void = () => {};
    server.use(
      // The list is read before the server has saved the message: it comes back empty.
      http.get(url, () => HttpResponse.json({ items: saved ? [saved] : [], nextCursor: null })),
      http.post(url, async ({ request }) => {
        const { clientRequestId } = (await request.json()) as { clientRequestId: string };
        await new Promise<void>((resolve) => (releaseSend = resolve));
        const now = new Date().toISOString();
        saved = {
          id: "m1", chatId: "c1", role: "user", status: "complete",
          content: [{ type: "text", text: "Hii" }], clientRequestId, createdAt: now, updatedAt: now,
        };
        return HttpResponse.json(
          { chatId: "c1", messageId: "m1", runId: "r1", realtime: { runId: "run_1", accessToken: "tok" } },
          { status: 201 },
        );
      }),
    );

    // One cache for the whole test (the shared wrapper above makes a new one per render).
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    const stableWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => ({ send: useSendMessage(), messages: useMessages("c1") }), { wrapper: stableWrapper });
    await waitFor(() => expect(result.current.messages.isSuccess).toBe(true));
    const texts = () =>
      (result.current.messages.data?.pages.flatMap((page) => page.items) ?? []).map((m) =>
        m.content[0]?.type === "text" ? m.content[0].text : "",
      );

    let sending: Promise<unknown> = Promise.resolve();
    act(() => {
      sending = result.current.send.mutateAsync({ chatId: "c1", content: "Hii", planMode: false });
    });

    // A list load while the send is pending must not wipe the message.
    await act(async () => {
      await result.current.messages.refetch();
    });
    await waitFor(() => expect(texts()).toEqual(["Hii"]));

    await act(async () => {
      releaseSend();
      await sending;
    });
    await waitFor(() => expect(result.current.messages.data?.pages[0]?.items[0]?.id).toBe("m1"));
    expect(texts()).toEqual(["Hii"]);
  });
});
