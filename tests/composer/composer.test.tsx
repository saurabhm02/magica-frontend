import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ComposerActions,
  ComposerError,
  ComposerProvider,
  ComposerRoot,
  ComposerTextarea,
} from "@/components/composer/composer";

function renderComposer(onSubmit = vi.fn()) {
  render(
    <ComposerProvider onSubmit={onSubmit}>
      <ComposerRoot>
        <ComposerTextarea />
        <ComposerActions />
      </ComposerRoot>
      <ComposerError />
    </ComposerProvider>,
  );
  return { onSubmit, textarea: screen.getByPlaceholderText("Assign a task or ask anything...") };
}

describe("Composer", () => {
  it("disables send until there is text", () => {
    const { textarea } = renderComposer();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "hi" } });
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("submits on Enter", () => {
    const { onSubmit, textarea } = renderComposer();
    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("hello", false);
  });

  it("toggling plan mode sends planMode: true with the message", () => {
    const { onSubmit, textarea } = renderComposer();
    const planModeButton = screen.getByRole("button", { name: "Plan mode" });
    expect(planModeButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(planModeButton);
    expect(planModeButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(textarea, { target: { value: "make a plan" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("make a plan", true);
  });

  it("marks look-only actions as disabled with no click handler", () => {
    renderComposer();

    for (const label of ["Choose project", "Skills", "Connect apps", "Meeting minutes", "Dictation"]) {
      const button = screen.getByRole("button", { name: label });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute("title", "Not available in this demo");
    }
  });

  it("does not submit on Shift+Enter", () => {
    const { onSubmit, textarea } = renderComposer();
    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears the input after a successful submit", async () => {
    const { textarea } = renderComposer(vi.fn().mockResolvedValue(undefined));
    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    await waitFor(() => expect(textarea).toHaveValue(""));
  });

  it("keeps the input and shows the error after a failed submit", async () => {
    const { textarea } = renderComposer(vi.fn().mockRejectedValue(new Error("A reply is already in progress.")));
    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(await screen.findByText("A reply is already in progress.")).toBeInTheDocument();
    expect(textarea).toHaveValue("hello");
  });
});
