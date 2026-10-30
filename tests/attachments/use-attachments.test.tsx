import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAttachments } from "@/components/attachments/use-attachments";
import { server } from "../mocks/server";
import { getLastUppy, resetUppyMock } from "../mocks/uppy";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@uppy/core", async () => ({ default: (await import("../mocks/uppy")).MockUppy }));
vi.mock("@uppy/transloadit", async () => ({ default: (await import("../mocks/uppy")).MockTransloadit }));

const paramsUrl = "http://localhost:4000/api/v1/uploads/params";
const completeUrl = "http://localhost:4000/api/v1/uploads/complete";
const libraryUrl = "http://localhost:4000/api/v1/attachments/from-library";

function file(name: string, type = "image/png", size = 1024) {
  return new File([new Uint8Array(size)], name, { type });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  resetUppyMock();
  server.use(
    http.post(paramsUrl, () => HttpResponse.json({ params: "{}", signature: "sha384:x" })),
    http.post(completeUrl, () =>
      HttpResponse.json({
        attachments: [
          { id: "att-1", source: "upload", kind: "image", mimeType: "image/png", sizeBytes: 1024, name: "a.png", url: "https://cdn/a.png", status: "ready", createdAt: new Date().toISOString() },
        ],
      }),
    ),
  );
});

describe("useAttachments", () => {
  it("adds a file, tracks progress, and marks it ready once the assembly completes", async () => {
    const { result } = renderHook(() => useAttachments("c1"), { wrapper });

    act(() => result.current.addFiles([file("a.png")]));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.status).toBe("uploading");

    const uppy = getLastUppy();
    const fileId = uppy.getFiles()[0]?.id as string;

    act(() => uppy.emit("upload-progress", { id: fileId }, { percentage: 42 }));
    await waitFor(() => expect(result.current.items[0]?.progress).toBe(42));

    act(() => uppy.emit("transloadit:assembly-created", { assembly_id: "asm-1" }, [fileId]));
    await act(async () => {
      uppy.emit("transloadit:complete", { assembly_id: "asm-1" });
    });

    await waitFor(() => expect(result.current.items[0]?.status).toBe("ready"));
    expect(result.current.items[0]?.attachmentId).toBe("att-1");
    expect(result.current.items[0]?.url).toBe("https://cdn/a.png");
  });

  it("keeps attachments in the order they were added", async () => {
    const { result } = renderHook(() => useAttachments("c2"), { wrapper });

    act(() => result.current.addFiles([file("a.png"), file("b.png")]));

    expect(result.current.items.map((item) => item.name)).toEqual(["a.png", "b.png"]);
  });

  it("removes an attachment and revokes its preview URL", async () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const { result } = renderHook(() => useAttachments("c3"), { wrapper });

    act(() => result.current.addFiles([file("a.png")]));
    const id = result.current.items[0]!.id;

    act(() => result.current.removeAttachment(id));

    expect(result.current.items).toHaveLength(0);
    expect(revoke).toHaveBeenCalled();
    revoke.mockRestore();
  });

  it("retries a failed upload", async () => {
    const { result } = renderHook(() => useAttachments("c4"), { wrapper });

    act(() => result.current.addFiles([file("a.png")]));
    const uppy = getLastUppy();
    const fileId = uppy.getFiles()[0]?.id as string;

    act(() => uppy.emit("upload-error", { id: fileId }, new Error("boom")));
    await waitFor(() => expect(result.current.items[0]?.status).toBe("failed"));

    act(() => result.current.retryAttachment(fileId));
    expect(uppy.retryUpload).toHaveBeenCalledWith(fileId);
    expect(result.current.items[0]?.status).toBe("uploading");
  });

  it("rejects a file over the size limit with the server's message, without uploading it", async () => {
    const { result } = renderHook(() => useAttachments("c5"), { wrapper });

    act(() => result.current.addFiles([file("huge.png", "image/png", 501 * 1024 * 1024)]));

    expect(result.current.items[0]?.status).toBe("failed");
    expect(result.current.items[0]?.error).toBe("File upload too large.");
    expect(getLastUppy().getFiles()).toHaveLength(0);
  });

  it("rejects a disallowed file type with the server's message", async () => {
    const { result } = renderHook(() => useAttachments("c6"), { wrapper });

    act(() => result.current.addFiles([file("script.exe", "application/x-msdownload")]));

    expect(result.current.items[0]?.status).toBe("failed");
    expect(result.current.items[0]?.error).toBe("File type not allowed.");
  });

  it("rejects a file past maxFiles", async () => {
    const { result } = renderHook(() => useAttachments("c7", { maxFiles: 1 }), { wrapper });

    act(() => result.current.addFiles([file("a.png")]));
    act(() => result.current.addFiles([file("b.png")]));

    expect(result.current.items[1]?.status).toBe("failed");
    expect(result.current.items[1]?.error).toBe("Cannot upload more than 1 files at once.");
  });

  it("attaches a library asset without going through Uppy", async () => {
    server.use(
      http.post(libraryUrl, () =>
        HttpResponse.json({ id: "att-2", source: "library", kind: "image", mimeType: "image/png", sizeBytes: 0, name: "lib.png", url: "https://cdn/lib.png", status: "ready", createdAt: new Date().toISOString() }),
      ),
    );
    const { result } = renderHook(() => useAttachments("c8"), { wrapper });

    await act(async () =>
      result.current.addFromLibrary({
        url: "https://cdn/lib.png",
        type: "image",
        source: "generated",
        name: "lib.png",
        sizeBytes: null,
        prompt: null,
        toolInvocationId: "inv-1",
        createdAt: new Date().toISOString(),
      }),
    );

    expect(result.current.items[0]?.status).toBe("ready");
    expect(result.current.items[0]?.attachmentId).toBe("att-2");
  });
});
