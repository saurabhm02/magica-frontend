import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SentAttachments } from "@/components/chat/sent-attachments";
import type { Attachment } from "@/contracts/attachment";

const now = new Date().toISOString();

function attachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: "att-1",
    source: "upload",
    kind: "image",
    mimeType: "image/png",
    sizeBytes: 945000,
    name: "photo.png",
    url: "https://cdn/photo.png",
    status: "ready",
    createdAt: now,
    ...overrides,
  };
}

describe("SentAttachments", () => {
  it("shows a skeleton until the image loads", () => {
    render(<SentAttachments attachments={[attachment()]} />);

    const img = screen.getByAltText("photo.png");
    const thumbnail = screen.getByRole("button", { name: "Open photo.png" });
    expect(thumbnail.querySelector(".animate-pulse")).toBeInTheDocument();

    fireEvent.load(img);
    expect(thumbnail.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("opens the preview modal on click", () => {
    render(<SentAttachments attachments={[attachment()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Open photo.png" }));

    expect(screen.getByText("Image Preview")).toBeInTheDocument();
    expect(screen.getByText("Uploaded")).toBeInTheDocument();
  });
});
