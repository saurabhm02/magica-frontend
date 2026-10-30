import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
const mockPathname = { current: "/chat/c-test-tools" };
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockPathname.current,
}));

import { ArtifactPanel } from "@/components/artifacts/artifact-panel";
import { AssistantText } from "@/components/chat/assistant-text";
import { ChatMessages } from "@/components/chat/chat-messages";
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

    const summaryBtn = screen.getByRole("button", { name: /Looked up a model, generated an image/i });
    expect(summaryBtn).toBeInTheDocument();
    expect(screen.queryByText("Checking image model settings")).not.toBeInTheDocument();

    fireEvent.click(summaryBtn);
    expect(screen.getByText("Checking image model settings")).toBeInTheDocument();
    expect(screen.getByText("Generating your red apple image")).toBeInTheDocument();
  });

  it("marks the row's toggle button as aria-expanded", () => {
    render(
      <StepList
        isLive={false}
        status="complete"
        steps={[
          {
            id: "s1",
            name: "gpt_image_2",
            renderKey: "image-result",
            status: "succeeded",
            label: "Generating your red apple image",
            doneLabel: "generated an image",
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Generated an image" }));

    const toggle = screen.getByRole("button", { name: "Toggle details" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});

describe("StepList status text", () => {
  it("shows 'Waiting for you' when the run is waiting on the user", () => {
    render(<StepList isLive={true} status="waiting" steps={[]} />);
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
  });

  it("shows 'Stopping generation…' while a run is being cancelled", () => {
    render(<StepList isLive={true} status="stopping" steps={[]} />);
    expect(screen.getByText("Stopping generation…")).toBeInTheDocument();
  });
});

describe("Side Panel / Artifact Panel", () => {
  beforeEach(() => {
    mockPathname.current = "/chat/c-test-tools";
  });

  it("closes when the chat route changes", () => {
    const { rerender } = render(
      <div>
        <MediaAsset asset={{ type: "image", url: "https://example.com/apple.png" }} />
        <ArtifactPanel />
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "View image" }));
    expect(screen.getByTestId("artifact-panel")).toBeInTheDocument();

    mockPathname.current = "/chat/other-chat";
    rerender(
      <div>
        <MediaAsset asset={{ type: "image", url: "https://example.com/apple.png" }} />
        <ArtifactPanel />
      </div>,
    );
    expect(screen.queryByTestId("artifact-panel")).not.toBeInTheDocument();
  });

  it("shows step fields and media in the side panel when a step is clicked", () => {
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
              assets: [{ type: "image", url: "https://example.com/panel-apple.png" }],
            },
          ]}
        />
        <ArtifactPanel />
      </div>,
    );

    fireEvent.click(within(screen.getByTestId("step-row-image-result")).getByRole("button", { name: "Generating your red apple imagea red apple" }));

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

  it("shows the step's real status in the side panel", () => {
    render(
      <div>
        <StepList
          isLive={true}
          status="working"
          steps={[
            {
              id: "s-running",
              name: "gpt_image_2",
              renderKey: "image-result",
              status: "running",
              label: "Generating",
              startedAt: now,
            },
          ]}
        />
        <ArtifactPanel />
      </div>,
    );

    fireEvent.click(within(screen.getByTestId("step-row-image-result")).getByRole("button", { name: "Generating" }));
    expect(within(screen.getByTestId("artifact-panel")).getByText("Running")).toBeInTheDocument();
  });
});

describe("MediaAsset & Markdown", () => {
  it("keeps the image's own shape instead of cropping it to fit", () => {
    render(<MediaAsset asset={{ type: "image", url: "https://example.com/story.png", title: "Story" }} />);

    const img = screen.getByRole("img", { name: "Story" });
    expect(img).not.toHaveClass("object-cover");
    expect(img).not.toHaveClass("w-full");
    expect(img).toHaveClass("w-auto", "h-auto", "max-h-[460px]");
  });

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

    fireEvent.click(screen.getByRole("button", { name: "A red apple" }));
    expect(screen.getByTestId("artifact-panel")).toBeInTheDocument();
  });

  it("labels the download button 'Download video' for video assets", () => {
    render(<MediaAsset asset={{ type: "video", url: "https://example.com/clip.mp4" }} />);
    expect(screen.getByRole("button", { name: "Download video" })).toBeInTheDocument();
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
  it("never shows an empty bubble: shows Thinking while working with no tools and no text yet", () => {
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
    expect(screen.getByText("Thinking")).toBeInTheDocument();
  });

  it("shows a non-blocking Reconnecting indicator while isReconnecting is set", () => {
    useLiveRunStore.setState({
      runs: {
        [chatId]: {
          status: "working",
          text: "partial",
          thinkingStartedAt: now,
          tools: [],
          assets: [],
          isReconnecting: true,
        },
      },
    });

    render(<LiveBubble chatId={chatId} />);
    expect(screen.getByText("Reconnecting…")).toBeInTheDocument();
    expect(screen.getByText("partial")).toBeInTheDocument();
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
    expect(screen.getByText(/Thinking/)).toBeInTheDocument();
  });

  it("clicking Thinking opens and closes the model's live reasoning", () => {
    useLiveRunStore.setState({
      runs: { [chatId]: { status: "thinking", text: "", reasoning: "The user wants to know about the project", tools: [], assets: [] } },
    });

    render(<LiveBubble chatId={chatId} />);
    const toggle = screen.getByRole("button", { name: /Thinking/ });
    expect(screen.queryByText(/The user wants/)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/The user wants/)).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText(/The user wants/)).not.toBeInTheDocument();
  });
});

describe("StepList reasoning rows", () => {
  const reasoningStep = {
    id: "reasoning_0",
    name: "reasoning",
    renderKey: "reasoning",
    status: "succeeded" as const,
    label: "Decided to inspect the working directory",
    text: "Here's a thinking process:\nThe question is **ambiguous**, so I should look at the workspace.",
  };
  const toolStep = { id: "t1", name: "run_command", renderKey: "run_command", status: "succeeded" as const, label: "Ran a command", doneLabel: "ran a command" };

  it("shows the title in the header and as a row, leaves it out of the summary, and expands to the cleaned thinking", () => {
    const { rerender } = render(<StepList steps={[reasoningStep, toolStep]} isLive status="working" thinkingStartedAt={now} />);
    expect(screen.getAllByText(/^Decided to inspect the working directory/)).toHaveLength(2); // header + row

    fireEvent.click(screen.getByTestId("step-row-reasoning").querySelector("button")!);
    expect(screen.getByText("The question is ambiguous, so I should look at the workspace.")).toBeInTheDocument();

    rerender(<StepList steps={[reasoningStep, toolStep]} />);
    expect(screen.getByRole("button", { name: /^Ran a command/ })).toBeInTheDocument();
  });

  it("shows the raw thinking on one line until the title arrives", () => {
    render(<StepList steps={[{ ...reasoningStep, label: undefined }, { ...toolStep, status: "running" }]} isLive status="working" thinkingStartedAt={now} />);
    expect(within(screen.getByTestId("step-row-reasoning")).getByText(/^The question is ambiguous/)).toBeInTheDocument();
  });

  it("streams the thinking for the next step as a live grey row after the steps already shown", () => {
    const shown = "First I check the brief.";
    render(
      <StepList
        steps={[{ ...reasoningStep, text: shown }, toolStep]}
        isLive
        status="working"
        thinkingStartedAt={now}
        reasoning={`${shown}Since they picked bold, I'll make three options`}
      />,
    );
    const rows = screen.getAllByTestId("step-row-reasoning");
    expect(rows).toHaveLength(2);
    expect(within(rows[1]!).getByText("Since they picked bold, I'll make three options")).toBeInTheDocument();
    expect(screen.getByText(/^Working \d+s/)).toBeInTheDocument();
  });

  it("shows nothing for thinking alone, like a plain Magica reply", () => {
    const { container } = render(<StepList steps={[reasoningStep]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Turn credit total", () => {
  it("adds every tool's cost without rounding a small step away (0.07M + 0.005M = 0.075M)", async () => {
    const message: Message = {
      id: "m-credits",
      chatId,
      role: "assistant",
      status: "complete",
      clientRequestId: null,
      attachments: [],
      createdAt: now,
      updatedAt: now,
      content: [
        { type: "tool_use", id: "t-gen", name: "gpt_image_2", input: { prompt: "red mug" }, label: "Generating your image" },
        { type: "tool_result", toolUseId: "t-gen", output: { images: ["https://example.com/mug.png"] }, credits: 70_000 },
        { type: "tool_use", id: "t-crop", name: "crop_image", input: { image_url: "https://example.com/mug.png" }, label: "Cropping your image" },
        { type: "tool_result", toolUseId: "t-crop", output: { image_url: "https://example.com/mug-square.png" }, credits: 5_000 },
        { type: "text", text: "Done!" },
      ],
    };
    server.use(http.get(messagesUrl, () => HttpResponse.json({ items: [message], nextCursor: null })));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessages chatId={chatId} onRetry={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByTestId("message-credits")).toHaveTextContent("0.075M credits");
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
      attachments: [],
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

    server.use(http.get(messagesUrl, () => HttpResponse.json({ items: [savedMessage], nextCursor: null })));

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

  it("renders text, citations, and usage in order", async () => {
    const savedMessage: Message = {
      id: "m-saved-2",
      chatId,
      role: "assistant",
      status: "complete",
      clientRequestId: null,
      attachments: [],
      createdAt: now,
      updatedAt: now,
      content: [
        { type: "text", text: "The sky is blue because of Rayleigh scattering." },
        {
          type: "citations",
          citations: [
            { url: "https://en.wikipedia.org/wiki/Rayleigh_scattering", title: "Rayleigh scattering - Wikipedia" },
            { url: "https://example.com/no-title-page" },
          ],
        },
        { type: "usage", promptTokens: 1000, completionTokens: 234, totalTokens: 1234 },
      ],
    };

    server.use(http.get(messagesUrl, () => HttpResponse.json({ items: [savedMessage], nextCursor: null })));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessages chatId={chatId} onRetry={vi.fn()} />
      </QueryClientProvider>,
    );

    const text = await screen.findByText("The sky is blue because of Rayleigh scattering.");
    const sourcesLink = screen.getByRole("link", { name: "Rayleigh scattering - Wikipedia" });
    const hostnameLink = screen.getByRole("link", { name: "example.com" });
    const usage = screen.getByTestId("message-usage");

    expect(sourcesLink).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Rayleigh_scattering");
    expect(sourcesLink).toHaveAttribute("target", "_blank");
    expect(sourcesLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(hostnameLink).toHaveAttribute("href", "https://example.com/no-title-page");
    expect(usage).toHaveTextContent("Tokens: 1,234 (prompt 1,000 · reply 234)");

    expect(text.compareDocumentPosition(sourcesLink)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(sourcesLink.compareDocumentPosition(usage)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders no usage line when there are no tokens", async () => {
    const savedMessage: Message = {
      id: "m-saved-3",
      chatId,
      role: "assistant",
      status: "complete",
      clientRequestId: null,
      attachments: [],
      createdAt: now,
      updatedAt: now,
      content: [
        { type: "text", text: "Hello there." },
        { type: "usage", promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      ],
    };

    server.use(http.get(messagesUrl, () => HttpResponse.json({ items: [savedMessage], nextCursor: null })));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ChatMessages chatId={chatId} onRetry={vi.fn()} />
      </QueryClientProvider>,
    );

    await screen.findByText("Hello there.");
    expect(screen.queryByTestId("message-usage")).not.toBeInTheDocument();
  });
});
