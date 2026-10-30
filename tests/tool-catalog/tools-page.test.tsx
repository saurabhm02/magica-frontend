import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import ToolsPage from "@/app/(app)/tools/page";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const url = "http://localhost:4000/api/v1/tools";

function tool(overrides: Partial<{ name: string; displayName: string; description: string; category: string; estimatedCredits: number }>) {
  return {
    name: "crop-image",
    displayName: "Crop Image",
    description: "Crop an image to the dimensions you choose.",
    category: "util",
    estimatedCredits: 5000,
    ...overrides,
  };
}

function renderToolsPage() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <ToolsPage />
    </QueryClientProvider>,
  );
}

describe("ToolsPage", () => {
  it("shows the tool's tagline and price on its card", async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json([tool({ description: "Crop an image to the dimensions you choose.", estimatedCredits: 5000 })]),
      ),
    );

    renderToolsPage();

    expect(await screen.findByText("Crop an image to the dimensions you choose.")).toBeInTheDocument();
    expect(screen.getByText("~ 0.005M")).toBeInTheDocument();
  });

  it("filters by category chip and by search text", async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json([
          tool({ name: "crop-image", displayName: "Crop Image", category: "image" }),
          tool({ name: "gemini-omni-flash", displayName: "Gemini Omni Flash", category: "video" }),
        ]),
      ),
    );

    renderToolsPage();

    expect(await screen.findByText("Crop Image")).toBeInTheDocument();
    expect(screen.getByText("Gemini Omni Flash")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Image" }));
    expect(screen.getByText("Crop Image")).toBeInTheDocument();
    expect(screen.queryByText("Gemini Omni Flash")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(screen.getByPlaceholderText("Search tools"), { target: { value: "gemini" } });
    expect(screen.queryByText("Crop Image")).not.toBeInTheDocument();
    expect(screen.getByText("Gemini Omni Flash")).toBeInTheDocument();
  });

  it("keeps every category chip enabled, even ones with no tools", async () => {
    server.use(http.get(url, () => HttpResponse.json([tool({ category: "util" })])));

    renderToolsPage();

    expect(await screen.findByText("Crop Image")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Utils" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Audio" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "LLMs" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Audio" }));
    expect(screen.queryByText("Crop Image")).not.toBeInTheDocument();
    expect(screen.getByText("No tools found.")).toBeInTheDocument();
  });
});
