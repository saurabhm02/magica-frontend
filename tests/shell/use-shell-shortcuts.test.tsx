import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useShellShortcuts } from "@/components/shell/use-shell-shortcuts";
import { useUiStore } from "@/stores/ui.store";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function Host() {
  useShellShortcuts();
  return null;
}

beforeEach(() => {
  push.mockClear();
  useUiStore.setState({ sidebarCollapsed: false });
});

describe("useShellShortcuts", () => {
  it("opens tasks with the search box focused on Cmd/Ctrl+K", () => {
    render(<Host />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(push).toHaveBeenCalledWith("/tasks?focus=1");
  });

  it("toggles the sidebar on Cmd/Ctrl+B", () => {
    render(<Host />);
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });

  it("starts a new task on Shift+Cmd+O", () => {
    render(<Host />);
    fireEvent.keyDown(window, { key: "o", metaKey: true, shiftKey: true });
    expect(push).toHaveBeenCalledWith("/");
  });
});
