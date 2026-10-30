import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComposerActions, ComposerProvider, ComposerRoot, ComposerTextarea } from "@/components/composer/composer";
import { resetAttachmentDrafts } from "@/components/attachments/use-attachments";
import { server } from "../mocks/server";
import { getLastUppy, resetUppyMock } from "../mocks/uppy";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@uppy/core", async () => ({ default: (await import("../mocks/uppy")).MockUppy }));
vi.mock("@uppy/transloadit", async () => ({ default: (await import("../mocks/uppy")).MockTransloadit }));

function file(name: string) {
  return new File([new Uint8Array(1024)], name, { type: "image/png" });
}

function renderComposer(onSubmit = vi.fn()) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <ComposerProvider chatId="c1" onSubmit={onSubmit}>
        <ComposerRoot>
          <ComposerTextarea />
          <ComposerActions />
        </ComposerRoot>
      </ComposerProvider>
    </QueryClientProvider>,
  );
  return { onSubmit, textarea: screen.getByPlaceholderText("Assign a task or ask anything...") };
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

function fileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("ComposerChips", () => {
  it("shows a spinner while uploading, then the thumbnail once ready", async () => {
    renderComposer();

    await act(async () => fireEvent.change(fileInput(), { target: { files: [file("a.png")] } }));
    expect(screen.getByRole("button", { name: "Open a.png" })).toBeInTheDocument();

    const uppy = getLastUppy();
    const fileId = uppy.getFiles()[0]!.id;
    act(() => uppy.emit("transloadit:assembly-created", { assembly_id: "asm-1" }, [fileId]));
    await act(async () => uppy.emit("transloadit:complete", { assembly_id: "asm-1" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Remove a.png" })).toBeInTheDocument());
  });

  it("keeps chips in the order files were added", async () => {
    renderComposer();

    await act(async () => fireEvent.change(fileInput(), { target: { files: [file("a.png"), file("b.png")] } }));

    const chips = screen.getAllByLabelText(/^Open /);
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual(["Open a.png", "Open b.png"]);
  });

  it("removes a chip on click", async () => {
    renderComposer();

    await act(async () => fireEvent.change(fileInput(), { target: { files: [file("a.png")] } }));
    fireEvent.click(screen.getByRole("button", { name: "Remove a.png" }));

    expect(screen.queryByLabelText("Open a.png")).not.toBeInTheDocument();
  });

  it("retries a failed upload", async () => {
    renderComposer();

    await act(async () => fireEvent.change(fileInput(), { target: { files: [file("a.png")] } }));
    const uppy = getLastUppy();
    const fileId = uppy.getFiles()[0]!.id;
    act(() => uppy.emit("upload-error", { id: fileId }, new Error("boom")));

    const retryBtn = await screen.findByRole("button", { name: "Retry a.png" });
    fireEvent.click(retryBtn);
    expect(uppy.retryUpload).toHaveBeenCalledWith(fileId);
  });

  it("typing still works while a file is uploading", async () => {
    const { textarea } = renderComposer();

    await act(async () => fireEvent.change(fileInput(), { target: { files: [file("a.png")] } }));
    fireEvent.change(textarea, { target: { value: "describe this" } });

    expect(textarea).toHaveValue("describe this");
  });

  it("disables send while a file is uploading", async () => {
    renderComposer();

    await act(async () => fireEvent.change(fileInput(), { target: { files: [file("a.png")] } }));
    const textarea = screen.getByPlaceholderText("Assign a task or ask anything...");
    fireEvent.change(textarea, { target: { value: "hi" } });

    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("opens Cmd+U's file picker from the textarea", async () => {
    const { textarea } = renderComposer();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});

    fireEvent.keyDown(textarea, { key: "u", metaKey: true });

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
