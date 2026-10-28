import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComposerActions, ComposerProvider, ComposerRoot, ComposerTextarea } from "@/components/composer/composer";

function renderComposer(onSubmit = vi.fn()) {
  render(
    <ComposerProvider onSubmit={onSubmit}>
      <ComposerRoot>
        <ComposerTextarea />
        <ComposerActions />
      </ComposerRoot>
    </ComposerProvider>,
  );
  return { onSubmit, textarea: screen.getByPlaceholderText("Assign a task or ask anything...") };
}

describe("Composer", () => {
  it("disables send until there is text", () => {
    const { textarea } = renderComposer();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "hi" } });
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  it("submits on Enter", () => {
    const { onSubmit, textarea } = renderComposer();
    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("hello");
  });

  it("does not submit on Shift+Enter", () => {
    const { onSubmit, textarea } = renderComposer();
    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
