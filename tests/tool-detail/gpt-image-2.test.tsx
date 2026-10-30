import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolDetail } from "@/components/tool-detail/tool-detail";
import { resetRealtimeMock } from "../mocks/trigger-realtime";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));

// The real app re-renders on navigation because Next's router owns the URL as external
// state; this mock does the same so changing `subModel` triggers a re-render in the test.
let searchParams = new URLSearchParams();
const listeners = new Set<() => void>();
const replace = vi.fn((url: string) => {
  searchParams = new URLSearchParams(url.split("?")[1] ?? "");
  listeners.forEach((listener) => listener());
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => {
    const [, forceRender] = useState(0);
    useEffect(() => {
      const listener = () => forceRender((n) => n + 1);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);
    return searchParams;
  },
}));
vi.mock("@trigger.dev/react-hooks", async () => {
  const mock = await import("../mocks/trigger-realtime");
  return { useRealtimeRun: mock.useRealtimeRun };
});

const base = "http://localhost:4000/api/v1";
const toolName = "gpt_image_2";

const gptImage2Schema = {
  type: "object",
  properties: {
    prompt: { type: "string", minLength: 1, maxLength: 4000, title: "Prompt" },
    mode: { type: "string", enum: ["text", "edit"] },
    uploadedImages: { type: "array", items: { type: "string", format: "uri" }, maxItems: 10 },
    size: { type: "string", enum: ["Auto", "1024x1024"], default: "1024x1024", title: "Size" },
    quality: { type: "string", enum: ["High", "Medium", "Low"], default: "Medium", title: "Quality" },
    background: { type: "string", enum: ["Auto", "Opaque"], title: "Background" },
    n: { type: "integer", minimum: 1, maximum: 4, default: 1, title: "Number of Images" },
    output_format: { type: "string", enum: ["PNG", "JPEG", "WebP"], title: "Output Format" },
  },
  required: ["prompt", "size", "quality", "n"],
};

function toolDetail() {
  return {
    name: toolName,
    displayName: "GPT Image 2",
    description: "Generate or edit images with GPT Image 2.",
    category: "image",
    inputs: gptImage2Schema,
    pricingLines: ["0.01M credits per image"],
    defaultEstimate: 10000,
  };
}

function renderToolDetail() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <ToolDetail name={toolName} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  resetRealtimeMock();
  searchParams = new URLSearchParams();
  replace.mockClear();
  server.use(
    http.get(`${base}/tools/${toolName}`, () => HttpResponse.json(toolDetail())),
    http.get(`${base}/tools/${toolName}/runs`, () => HttpResponse.json({ items: [], nextCursor: null })),
  );
});

describe("GPT Image 2 input", () => {
  it("defaults to Text to Image, with the title showing the sub-model and no image upload", async () => {
    renderToolDetail();

    expect(await screen.findByText(/GPT Image 2 — Text to Image/)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sub-model" })).toHaveValue("text");
    expect(screen.queryByRole("button", { name: /Upload image/ })).not.toBeInTheDocument();
  });

  it("switching to Image to Image shows the image upload and updates the title and URL", async () => {
    renderToolDetail();
    await screen.findByText("Prompt");

    fireEvent.change(screen.getByRole("combobox", { name: "Sub-model" }), { target: { value: "edit" } });

    expect(await screen.findByText(/GPT Image 2 — Image to Image/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload image/ })).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(`/tools/${toolName}?subModel=gpt-image-2-edit`, { scroll: false });
  });

  it("shows the prompt character counter and Number of Images as a select", async () => {
    renderToolDetail();
    await screen.findByText("Prompt");

    expect(screen.getByText("0/4000")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Enter Prompt..."), { target: { value: "a red apple" } });
    expect(screen.getByText("11/4000")).toBeInTheDocument();

    expect(screen.getByText("Number of Images")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "4" })).toBeInTheDocument();
  });

  it("tucks Background and Output Format under Advanced Settings (2)", async () => {
    renderToolDetail();
    await screen.findByText("Prompt");

    expect(screen.getByRole("button", { name: "Advanced Settings (2)" })).toBeInTheDocument();
    expect(screen.queryByText("Background")).not.toBeInTheDocument();
  });
});
