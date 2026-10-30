import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreditsPopover } from "@/components/shell/credits-popover";

describe("CreditsPopover", () => {
  it("shows the plan, balance, and links to usage", () => {
    render(<CreditsPopover balance={25_540_000} onClose={vi.fn()} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("25.54M")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View usage/ })).toHaveAttribute("href", "/usage");
  });

  it("closes on outside click", () => {
    const onClose = vi.fn();
    render(<CreditsPopover balance={25_540_000} onClose={onClose} />);

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<CreditsPopover balance={25_540_000} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
