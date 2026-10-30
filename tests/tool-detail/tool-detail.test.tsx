import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolDetail } from "@/components/tool-detail/tool-detail";
import { emitFinished, resetRealtimeMock } from "../mocks/trigger-realtime";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@trigger.dev/react-hooks", async () => {
  const mock = await import("../mocks/trigger-realtime");
  return { useRealtimeRun: mock.useRealtimeRun };
});

const base = "http://localhost:4000/api/v1";
const toolName = "crop_image";
const now = new Date().toISOString();

const detailSchema = {
  type: "object",
  properties: {
    prompt: { type: "string", description: "What to crop", maxLength: 4000 },
    quality: { type: "string", enum: ["High", "Medium", "Low"], default: "Medium" },
    amount: { type: "number", minimum: 0, maximum: 100 },
  },
  required: ["prompt", "quality"],
};

function toolDetail(overrides: Partial<{ pricingLines: string[] }> = {}) {
  return {
    name: toolName,
    displayName: "Crop Image",
    description: "Crop an image to the dimensions you choose.",
    category: "util",
    inputs: detailSchema,
    pricingLines: overrides.pricingLines ?? ["0.005M credits per image"],
    defaultEstimate: 5000,
  };
}

function runResponse(overrides: Partial<{ status: string; assets: { type: string; url: string }[] }>) {
  return {
    id: "run-db-1",
    runId: "run-db-1",
    triggerRunId: "trigger-1",
    accessToken: "tok",
    realtime: { runId: "trigger-1", accessToken: "tok" },
    toolName,
    status: overrides.status ?? "running",
    output: null,
    credits: 5000,
    durationMs: null,
    error: null,
    assets: overrides.assets ?? [],
    createdAt: now,
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
  server.use(http.get(`${base}/tools/${toolName}/runs`, () => HttpResponse.json({ items: [], nextCursor: null })));
});

describe("ToolDetail form", () => {
  it("builds fields from the schema: enum becomes a select, and a required field without a default gets a red star", async () => {
    server.use(http.get(`${base}/tools/${toolName}`, () => HttpResponse.json(toolDetail())));
    renderToolDetail();

    expect(await screen.findByText("Prompt")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("hides an optional field with no default under Advanced Settings until opened", async () => {
    server.use(http.get(`${base}/tools/${toolName}`, () => HttpResponse.json(toolDetail())));
    renderToolDetail();
    await screen.findByText("Prompt");

    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Advanced Settings (1)" });

    fireEvent.click(toggle);
    expect(screen.getByRole("slider")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });
});

describe("ToolDetail generate", () => {
  it("posts the input and shows the output once the realtime run finishes", async () => {
    server.use(http.get(`${base}/tools/${toolName}`, () => HttpResponse.json(toolDetail())));

    let posted: unknown;
    server.use(
      http.post(`${base}/tools/${toolName}/runs`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ runId: "run-db-1", realtime: { runId: "trigger-1", accessToken: "tok" } });
      }),
    );

    let getRunCalls = 0;
    server.use(
      http.get(`${base}/tool-runs/run-db-1`, () => {
        getRunCalls += 1;
        return HttpResponse.json(
          getRunCalls === 1
            ? runResponse({ status: "running" })
            : runResponse({ status: "succeeded", assets: [{ type: "image", url: "https://example.com/out.png" }] }),
        );
      }),
    );

    renderToolDetail();
    await screen.findByText("Prompt");

    fireEvent.change(screen.getByPlaceholderText("Enter Prompt..."), { target: { value: "a red apple" } });

    const generateBtn = screen.getByRole("button", { name: /Generate/ });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    await waitFor(() => expect(posted).toEqual({ input: { prompt: "a red apple", quality: "Medium" } }));
    expect(await screen.findByText("This may take a moment")).toBeInTheDocument();

    await act(async () => emitFinished("trigger-1"));

    const img = await screen.findByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/out.png");
  });

  it("New Run clears the output and the selected run", async () => {
    server.use(http.get(`${base}/tools/${toolName}`, () => HttpResponse.json(toolDetail())));
    server.use(
      http.post(`${base}/tools/${toolName}/runs`, () =>
        HttpResponse.json({ runId: "run-db-1", realtime: { runId: "trigger-1", accessToken: "tok" } }),
      ),
      http.get(`${base}/tool-runs/run-db-1`, () => HttpResponse.json(runResponse({ status: "running" }))),
    );

    renderToolDetail();
    await screen.findByText("Prompt");
    fireEvent.change(screen.getByPlaceholderText("Enter Prompt..."), { target: { value: "a red apple" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Generate/ }));
    });
    await screen.findByText("This may take a moment");

    fireEvent.click(screen.getByRole("button", { name: "New Run" }));

    expect(screen.getByText("No output yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New Run" })).not.toBeInTheDocument();
  });

  it("Reset clears a typed field back to empty", async () => {
    server.use(http.get(`${base}/tools/${toolName}`, () => HttpResponse.json(toolDetail())));
    renderToolDetail();
    await screen.findByText("Prompt");

    const promptInput = screen.getByPlaceholderText("Enter Prompt...");
    fireEvent.change(promptInput, { target: { value: "a red apple" } });
    expect(promptInput).toHaveValue("a red apple");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(promptInput).toHaveValue("");
  });
});

describe("ToolDetail run history", () => {
  it("renders rows from the API", async () => {
    server.use(http.get(`${base}/tools/${toolName}`, () => HttpResponse.json(toolDetail())));
    server.use(
      http.get(`${base}/tools/${toolName}/runs`, () =>
        HttpResponse.json({
          items: [
            {
              runId: "cmvsww1ws001rl208long",
              toolName,
              status: "succeeded",
              credits: 5000,
              output: null,
              assets: [],
              createdAt: now,
            },
          ],
          nextCursor: null,
        }),
      ),
    );

    renderToolDetail();

    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("0.005M")).toBeInTheDocument();
    expect(screen.getByText(/cmvsww1ws001rl208/)).toBeInTheDocument();
  });

  it("shows a pending or running run as 'Running' with no credits pill", async () => {
    server.use(http.get(`${base}/tools/${toolName}`, () => HttpResponse.json(toolDetail())));
    server.use(
      http.get(`${base}/tools/${toolName}/runs`, () =>
        HttpResponse.json({
          items: [
            { runId: "run-running-1", toolName, status: "running", credits: 0, output: null, assets: [], createdAt: now },
          ],
          nextCursor: null,
        }),
      ),
    );

    renderToolDetail();

    expect(await screen.findByText("Running")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });
});

describe("ToolDetail pricing", () => {
  it("renders the pricing lines from the API", async () => {
    server.use(
      http.get(`${base}/tools/${toolName}`, () =>
        HttpResponse.json(toolDetail({ pricingLines: ["0.005M credits per image", "+0.001M per extra pass"] })),
      ),
    );

    renderToolDetail();

    expect(await screen.findByText("0.005M credits per image")).toBeInTheDocument();
    expect(screen.getByText("+0.001M per extra pass")).toBeInTheDocument();
  });
});
