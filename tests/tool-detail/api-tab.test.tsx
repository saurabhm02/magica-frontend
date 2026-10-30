import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiTab } from "@/components/tool-detail/api-tab";

const schema = {
  type: "object",
  properties: {
    image_url: { type: "string", format: "uri", title: "Input Image", description: "Upload an image to crop" },
    x_percent: { type: "number", minimum: 0, maximum: 100, title: "X Position (%)", default: 0 },
  },
  required: ["image_url"],
};

function renderApiTab() {
  render(<ApiTab toolName="crop_image" schema={schema} pricingLines={["0.005M credits per image"]} estimatedCredits={5000} />);
}

describe("ApiTab", () => {
  it("defaults to Python and shows the run + poll endpoints", () => {
    renderApiTab();

    expect(screen.getByRole("button", { name: /python/i })).toBeInTheDocument();
    expect(screen.getAllByText(/tools\/crop_image\/runs/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/tool-runs\/\{runId\}/).length).toBeGreaterThan(0);
  });

  it("switches the code sample language", () => {
    renderApiTab();

    fireEvent.click(screen.getByRole("button", { name: /python/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "cURL" }));

    expect(screen.getByRole("button", { name: /cURL/ })).toBeInTheDocument();
    expect(screen.getByText(/curl -X POST/)).toBeInTheDocument();
  });

  it("copies the current code sample to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderApiTab();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("tools/crop_image/runs"));
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("shows required and optional parameters with their limits", () => {
    renderApiTab();

    expect(screen.getByText("image_url")).toBeInTheDocument();
    expect(screen.getByText("required")).toBeInTheDocument();
    expect(screen.getByText("x_percent")).toBeInTheDocument();
    expect(screen.getByText("optional")).toBeInTheDocument();
    expect(screen.getByText(/Default: 0/)).toBeInTheDocument();
  });
});
