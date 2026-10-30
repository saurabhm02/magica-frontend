import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputCard } from "@/components/tool-detail/input-card";
import { server } from "../mocks/server";
import { resetAttachmentDrafts } from "@/components/attachments/use-attachments";
import { getLastUppy, resetUppyMock } from "../mocks/uppy";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@uppy/core", async () => ({ default: (await import("../mocks/uppy")).MockUppy }));
vi.mock("@uppy/transloadit", async () => ({ default: (await import("../mocks/uppy")).MockTransloadit }));

const mergeVideosSchema = {
  type: "object",
  properties: {
    video_urls: {
      type: "array",
      items: { type: "string", format: "uri" },
      minItems: 2,
      maxItems: 100,
      title: "Videos",
      description: "Upload 2–100 videos to concatenate (in order).",
    },
    transition: { type: "string", enum: ["none", "fade", "dissolve"], default: "none", title: "Transition" },
  },
  required: ["video_urls"],
};

function renderInputCard() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <InputCard schema={mergeVideosSchema} estimatedCredits={40000} isGenerating={false} onGenerate={vi.fn()} onNewRun={vi.fn()} />
    </QueryClientProvider>,
  );
}

function video(name: string) {
  return new File([new Uint8Array(1024)], name, { type: "video/mp4" });
}

beforeEach(() => {
  resetUppyMock();
  resetAttachmentDrafts();
  server.use(
    http.get("http://localhost:4000/api/v1/assets", () => HttpResponse.json({ items: [], nextCursor: null })),
    http.post("http://localhost:4000/api/v1/uploads/params", () => HttpResponse.json({ params: "{}", signature: "sha384:x" })),
  );
});

describe("Merge Videos input", () => {
  it("has no Advanced Settings and shows Transition as a visible select with a default", async () => {
    renderInputCard();

    expect(await screen.findByText("Videos")).toBeInTheDocument();
    expect(screen.getByText("Transition")).toBeInTheDocument();
    expect(screen.queryByText(/Advanced Settings/)).not.toBeInTheDocument();
  });

  it("uploads videos in order and keeps that order after removing one", async () => {
    server.use(
      http.post("http://localhost:4000/api/v1/uploads/complete", () =>
        HttpResponse.json({
          attachments: [
            { id: "att-1", source: "upload", kind: "video", mimeType: "video/mp4", sizeBytes: 1024, name: "first.mp4", url: "https://cdn/first.mp4", status: "ready", createdAt: new Date().toISOString() },
            { id: "att-2", source: "upload", kind: "video", mimeType: "video/mp4", sizeBytes: 1024, name: "second.mp4", url: "https://cdn/second.mp4", status: "ready", createdAt: new Date().toISOString() },
          ],
        }),
      ),
    );

    renderInputCard();
    await screen.findByText("Videos");

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => fireEvent.change(fileInput, { target: { files: [video("first.mp4"), video("second.mp4")] } }));

    const uppy = getLastUppy();
    const fileIds = uppy.getFiles().map((f) => f.id);
    act(() => uppy.emit("transloadit:assembly-created", { assembly_id: "asm-1" }, fileIds));
    await act(async () => uppy.emit("transloadit:complete", { assembly_id: "asm-1" }));

    const removeButtons = await screen.findAllByRole("button", { name: /^Remove / });
    expect(removeButtons.map((b) => b.getAttribute("aria-label"))).toEqual(["Remove first.mp4", "Remove second.mp4"]);

    fireEvent.click(removeButtons[0]!);
    expect(screen.getByRole("button", { name: "Remove second.mp4" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove first.mp4" })).not.toBeInTheDocument();
  });
});
