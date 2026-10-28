import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/shell/sidebar";
import { useUiStore } from "@/stores/ui.store";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }));

beforeEach(() => {
  useUiStore.setState({ sidebarCollapsed: false, mobileDrawerOpen: false });
});

describe("Sidebar", () => {
  it("collapses to the icon rail and back", () => {
    render(<Sidebar />);

    expect(screen.getByText("New task")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.queryByText("New task")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New task" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByText("New task")).toBeInTheDocument();
  });
});
