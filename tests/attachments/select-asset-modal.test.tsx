import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SelectAssetModal } from "@/components/attachments/select-asset-modal";
import { server } from "../mocks/server";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: async () => "token" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const assetsUrl = "http://localhost:4000/api/v1/assets";
const now = new Date().toISOString();

function generatedAsset() {
  return {
    url: "https://cdn/photo.png",
    type: "image" as const,
    source: "generated" as const,
    name: "my-logo.png",
    sizeBytes: 756000,
    prompt: "a minimalist logo",
    toolInvocationId: "inv-1",
    chatId: "c1",
    toolName: "gpt_image_2",
    createdAt: now,
  };
}

function uploadAsset() {
  return {
    url: "https://cdn/selfie.png",
    type: "image" as const,
    source: "upload" as const,
    name: "selfie-final.png",
    sizeBytes: 945000,
    prompt: null,
    attachmentId: "att-1",
    createdAt: now,
  };
}

function renderModal(onSelect = vi.fn()) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <SelectAssetModal open accept="image" onOpenChange={() => {}} onSelect={onSelect} onUploadInstead={() => {}} />
    </QueryClientProvider>,
  );
  return { onSelect };
}

describe("SelectAssetModal", () => {
  it("shows the real asset name, never one parsed from the URL", async () => {
    server.use(http.get(assetsUrl, () => HttpResponse.json({ items: [generatedAsset()], nextCursor: null, total: 1 })));
    renderModal();

    expect(await screen.findByText("my-logo.png")).toBeInTheDocument();
  });

  it("shows the file count from total, not the number of loaded items", async () => {
    server.use(http.get(assetsUrl, () => HttpResponse.json({ items: [generatedAsset()], nextCursor: null, total: 49 })));
    renderModal();

    expect(await screen.findByText("49 files")).toBeInTheDocument();
  });

  it("requests the right source for each tab", async () => {
    const requestedSources: (string | null)[] = [];
    server.use(
      http.get(assetsUrl, ({ request }) => {
        requestedSources.push(new URL(request.url).searchParams.get("source"));
        return HttpResponse.json({ items: [], nextCursor: null, total: 0 });
      }),
    );
    renderModal();
    await screen.findByText("0 files");

    fireEvent.click(screen.getByRole("button", { name: "Generated" }));
    await screen.findByText("0 files");
    fireEvent.click(screen.getByRole("button", { name: "My Uploads" }));
    await screen.findByText("0 files");

    expect(requestedSources).toEqual(["all", "generated", "uploads"]);
  });

  it("shows 'No favorites yet' without requesting assets", async () => {
    let requestCount = 0;
    server.use(
      http.get(assetsUrl, () => {
        requestCount += 1;
        return HttpResponse.json({ items: [generatedAsset()], nextCursor: null, total: 1 });
      }),
    );
    renderModal();
    await screen.findByText("my-logo.png");
    const countBeforeFavorites = requestCount;

    fireEvent.click(screen.getByRole("button", { name: "Favorites" }));

    expect(await screen.findByText("No favorites yet")).toBeInTheDocument();
    expect(requestCount).toBe(countBeforeFavorites);
  });

  it("picking a generated item sends toolInvocationId and url", async () => {
    server.use(http.get(assetsUrl, () => HttpResponse.json({ items: [generatedAsset()], nextCursor: null, total: 1 })));
    const { onSelect } = renderModal();

    fireEvent.click(await screen.findByRole("button", { name: "Image: my-logo.png" }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ toolInvocationId: "inv-1", url: "https://cdn/photo.png" }));
  });

  it("picking an upload sends its attachmentId", async () => {
    server.use(http.get(assetsUrl, () => HttpResponse.json({ items: [uploadAsset()], nextCursor: null, total: 1 })));
    const { onSelect } = renderModal();

    fireEvent.click(await screen.findByRole("button", { name: "Image: selfie-final.png" }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ attachmentId: "att-1" }));
  });

  it("has labelled hover actions on a tile", async () => {
    server.use(http.get(assetsUrl, () => HttpResponse.json({ items: [generatedAsset()], nextCursor: null, total: 1 })));
    renderModal();

    await screen.findByText("my-logo.png");
    expect(screen.getByRole("button", { name: "Select media" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Favorite" })).toBeInTheDocument();
  });
});
