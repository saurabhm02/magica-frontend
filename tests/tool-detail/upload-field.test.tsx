import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const cropImageSchema = {
  type: "object",
  properties: {
    image_url: { type: "string", format: "uri", title: "Input Image", description: "Upload an image to crop" },
  },
  required: ["image_url"],
};

function renderInputCard() {
  const queryClient = new QueryClient();
  const onGenerate = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <InputCard schema={cropImageSchema} estimatedCredits={5000} isGenerating={false} onGenerate={onGenerate} onNewRun={vi.fn()} />
    </QueryClientProvider>,
  );
  return { onGenerate };
}

function file(name = "a.png") {
  return new File([new Uint8Array(1024)], name, { type: "image/png" });
}

beforeEach(() => {
  resetUppyMock();
  resetAttachmentDrafts();
  server.use(
    http.get("http://localhost:4000/api/v1/assets", () => HttpResponse.json({ items: [], nextCursor: null })),
    http.post("http://localhost:4000/api/v1/uploads/params", () => HttpResponse.json({ params: "{}", signature: "sha384:x" })),
    http.post("http://localhost:4000/api/v1/uploads/complete", () =>
      HttpResponse.json({
        attachments: [
          { id: "att-1", source: "upload", kind: "image", mimeType: "image/png", sizeBytes: 1024, name: "a.png", url: "https://cdn/a.png", status: "ready", createdAt: new Date().toISOString() },
        ],
      }),
    ),
  );
});

describe("UploadField in the tool playground", () => {
  it("goes from empty to uploading to ready, enabling Generate once the image lands", async () => {
    renderInputCard();

    expect(screen.getByRole("button", { name: /Upload image/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => fireEvent.change(fileInput, { target: { files: [file()] } }));

    expect(screen.getAllByText("Uploading...")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: /Uploading/ })).toBeDisabled();

    const uppy = getLastUppy();
    const fileId = uppy.getFiles()[0]!.id;
    act(() => uppy.emit("transloadit:assembly-created", { assembly_id: "asm-1" }, [fileId]));
    await act(async () => uppy.emit("transloadit:complete", { assembly_id: "asm-1" }));

    await waitFor(() => expect(screen.queryAllByText("Uploading...")).toHaveLength(0));
    expect(screen.getByRole("button", { name: /Change image/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled();
  });
});
