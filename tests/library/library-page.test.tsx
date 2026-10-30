import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LibraryPage from "@/app/(app)/library/page";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const now = new Date().toISOString();

beforeEach(() => {
  server.use(
    http.get("http://localhost:4000/api/v1/assets", () =>
      HttpResponse.json({
        items: [
          {
            url: "https://cdn/logo.png",
            type: "image",
            source: "generated",
            name: "logo.png",
            sizeBytes: 756000,
            prompt: "a minimalist logo",
            chatId: "c1",
            toolName: "gpt_image_2",
            toolInvocationId: "inv-1",
            createdAt: now,
          },
        ],
        nextCursor: null,
        total: 46,
      }),
    ),
  );
});

function renderLibrary() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <LibraryPage />
    </QueryClientProvider>,
  );
}

describe("LibraryPage", () => {
  it("shows the file count from total", async () => {
    renderLibrary();

    expect(await screen.findByText("46 files")).toBeInTheDocument();
  });

  it("opens the preview modal from a tile, showing its prompt, size and source", async () => {
    renderLibrary();

    fireEvent.click(await screen.findByRole("button", { name: "Image: logo.png" }));

    expect(screen.getByText("Image Preview")).toBeInTheDocument();
    expect(screen.getByText("a minimalist logo")).toBeInTheDocument();
    expect(screen.getByText("738 KB")).toBeInTheDocument();
    expect(screen.getByText("Generated via API")).toBeInTheDocument();
  });
});
