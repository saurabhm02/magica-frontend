import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { ArtifactPanel } from "@/components/artifacts/artifact-panel";
import { AssistantText, ChatMessages } from "@/components/chat/chat-messages";
import { LiveBubble } from "@/components/chat/live-bubble";
import { MediaAsset } from "@/components/chat/media-asset";
import { StepList } from "@/components/tools/step-list";
import type { Message } from "@/contracts/message";
import { useLiveRunStore } from "@/stores/live-run.store";
import { useUiStore } from "@/stores/ui.store";
import { server } from "../mocks/server";

const chatId = "c-test-tools";
const messagesUrl = `http://localhost:4000/api/v1/chats/${chatId}/messages`;
const now = new Date().toISOString();

beforeEach(() => {
  useLiveRunStore.setState({ runs: {} });
  useUiStore.setState({ artifactPanel: null });
  vi.restoreAllMocks();
});

describe("StepList & StepRow", () => {
  it("renders a running step row with label, detail, and live timer", () => {
    const startedAt = new Date(Date.now() - 18000).toISOString();
    render(
      <StepList
        isLive={true}
        status="working"
        steps={[
          {
            id: "s1",
            name: "gpt_image_2",
            renderKey: "image-result",
            status: "running",
            label: "Generating your red apple image...",
            detail: "a red apple",
            startedAt,
          },
        ]}
      />,
    );

    expect(screen.getByText("Generating your red apple image...")).toBeInTheDocument();
    expect(screen.getByText("a red apple")).toBeInTheDocument();
    expect(screen.getByText("18s")).toBeInTheDocument();
  });

  it("renders a completed step row with credits and model name", () => {
    render(
      <StepList
        isLive={true}
        status="working"
        steps={[
          {
            id: "s2",
            name: "gpt_image_2",
            renderKey: "image-result",
            status: "succeeded",
            label: "Generating your red apple image",
            detail: "a red apple",
            model: "GPT Image 2.5 Flare",
            credits: 80000,
          },
        ]}
      />,
    );

    expect(screen.getByText("Generating your red apple image")).toBeInTheDocument();
    expect(screen.getByText("a red apple")).toBeInTheDocument();
    expect(screen.getByText("GPT Image 2.5 Flare · 0.08M")).toBeInTheDocument();
  });

  it("renders a failed step row with safe error", () => {
    render(
      <StepList
        isLive={true}
        status="working"
        steps={[
          {
            id: "s3",
            name: "merge_videos",
            renderKey: "video-result",
            status: "failed",
            label: "Merging your videos...",
            detail: "2 videos",
            error: { code: "MAGICA_RUN_FAILED", message: "Video generation timed out.", retryable: false },
          },
        ]}
      />,
    );

    expect(screen.getByText("Merging your videos...")).toBeInTheDocument();
    expect(screen.getByText("2 videos")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("shows collapsed summary line after complete, and expands steps when clicked", () => {
    render(
      <StepList
        isLive={false}
        status="complete"
        steps={[
          {
            id: "s1",
            name: "get_model_info",
            renderKey: "model-info",
            status: "succeeded",
            label: "Checking image model settings",
            doneLabel: "looked up a model",
            detail: "gpt-image-2.5-flare-text",
          },
          {
            id: "s2",
            name: "gpt_image_2",
            renderKey: "image-result",
            status: "succeeded",
            label: "Generating your red apple image",
            doneLabel: "generated an image",
            detail: "a red apple",
            credits: 80000,
          },
        ]}
      />,
    );

    // Collapsed summary line
    const summaryBtn = screen.getByRole("button", { name: /Looked up a model, generated an image/i });
    expect(summaryBtn).toBeInTheDocument();

    // Step rows are initially hidden
    expect(screen.queryByText("Checking image model settings")).not.toBeInTheDocument();

    // Clicking expands the step card
    fireEvent.click(summaryBtn);
    expect(screen.getByText("Checking image model settings")).toBeInTheDocument();
    expect(screen.getByText("Generating your red apple image")).toBeInTheDocument();
  });
});

describe("Side Panel / Artifact Panel", () => {
  it("shows step fields and output media in side panel when step is clicked", () => {
    render(
      <div>
        <StepList
          isLive={true}
          status="working"
          steps={[
            {
              id: "s-panel",
              name: "gpt_image_2",
              renderKey: "image-result",
              status: "succeeded",
              label: "Generating your red apple image",
              detail: "a red apple",
              model: "GPT Image 2.5 Flare",
              credits: 80000,
              fields: [
                { label: "Model", value: "gpt-image-2-text" },
                { label: "Prompt", value: "a red apple" },
                { label: "Size", value: "1024x1024" },
              ],
              output: { images: ["https://example.com/panel-apple.png"] },
            },
          ]}
        />
        <ArtifactPanel />
      </div>,
    );

    fireEvent.click(screen.getByTestId("step-row-image-result"));

    const panel = screen.getByTestId("artifact-panel");
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText("Generating your red apple image")).toBeInTheDocument();
    expect(within(panel).getByText("0.08M credits")).toBeInTheDocument();
    expect(within(panel).getByText("Completed")).toBeInTheDocument();
    expect(within(panel).getByText("a red apple")).toBeInTheDocument();
    expect(within(panel).getByText("1024x1024")).toBeInTheDocument();

    const img = screen.getByRole("img", { name: "Generating your red apple image" });
    expect(img).toHaveAttribute("src", "https://example.com/panel-apple.png");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("artifact-panel")).not.toBeInTheDocument();
  });
});

describe("MediaAsset & Markdown", () => {
  it("renders image asset as img tag and opens artifact panel on click", () => {
    render(
      <div>
        <MediaAsset
          asset={{
            type: "image",
            url: "https://example.com/apple.png",
            title: "A red apple",
          }}
        />
        <ArtifactPanel />
      </div>,
    );

    const img = screen.getByRole("img", { name: "A red apple" });
    expect(img).toHaveAttribute("src", "https://example.com/apple.png");

    fireEvent.click(screen.getByTestId("media-asset"));
    expect(screen.getByTestId("artifact-panel")).toBeInTheDocument();
  });

  it("renders markdown formatting and inline markdown images", () => {
    render(
      <div>
        <AssistantText
          text={"Here is **bold text** and a [link](https://example.com):\n\n![Apple](https://example.com/inline-apple.png)"}
        />
        <ArtifactPanel />
      </div>,
    );

    expect(screen.getByText("bold text")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute("href", "https://example.com");

    const img = screen.getByRole("img", { name: "Apple" });
    expect(img).toHaveAttribute("src", "https://example.com/inline-apple.png");
  });
});

describe("LiveBubble", () => {
  it("never shows empty bubble: shows Working timer when status is working with no tools and no text yet", () => {
    useLiveRunStore.setState({
      runs: {
        [chatId]: {
          status: "working",
          text: "",
          thinkingStartedAt: now,
          tools: [],
          assets: [],
        },
      },
    });

    render(<LiveBubble chatId={chatId} />);
    expect(screen.getByText(/Working/)).toBeInTheDocument();
  });

  it("shows Thinking right after send", () => {
    useLiveRunStore.setState({
      runs: {
        [chatId]: {
          status: "thinking",
          text: "",
          thinkingStartedAt: now,
          tools: [],
          assets: [],
        },
      },
    });

    render(<LiveBubble chatId={chatId} />);
    expect(screen.getByText("Thinking")).toBeInTheDocument();
  });
});

describe("ChatMessages with saved tool content blocks", () => {
  it("renders saved tool_use and tool_result using StepList and renders generated media", async () => {
    const savedMessage: Message = {
      id: "m-saved-1",
      chatId,
      role: "assistant",
      status: "complete",
      clientRequestId: null,
      createdAt: now,
      updatedAt: now,
      content: [
        {
          type: "tool_use",
          id: "call_gpt_1",
          name: "gpt_image_2",
          input: { prompt: "a red apple" },
          label: "Generating your red apple image",
          doneLabel: "generated an image",
          detail: "a red apple",
          model: "GPT Image 2.5 Flare",
          fields: [{ label: "Prompt", value: "a red apple" }],
        },
        {
          type: "tool_result",
          toolUseId: "call_gpt_1",
          output: { images: ["https://example.com/saved-apple.png"] },
          credits: 80000,
        },
        {
          type: "text",
          text: "Here is your red apple:",
        },
      ],
    };

    server.use(
      http.get(messagesUrl, () => HttpResponse.json({ items: [savedMessage], nextCursor: null })),
    );

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessages chatId={chatId} onRetry={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Generated an image/i)).toBeInTheDocument();
    expect(screen.getByText("Here is your red apple:")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Generated image" })).toHaveAttribute(
      "src",
      "https://example.com/saved-apple.png",
    );
  });
});
