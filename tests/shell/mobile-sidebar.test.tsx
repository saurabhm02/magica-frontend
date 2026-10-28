import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileSidebar } from "@/components/shell/mobile-sidebar";
import { useUiStore } from "@/stores/ui.store";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }));

beforeEach(() => {
  useUiStore.setState({ sidebarCollapsed: false, mobileDrawerOpen: false });
});

describe("MobileSidebar", () => {
  it("opens on trigger click and closes on Escape", async () => {
    render(<MobileSidebar />);

    expect(screen.queryByRole("link", { name: "New task" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
    expect(await screen.findByRole("link", { name: "New task" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await screen.findByRole("button", { name: "Open sidebar" });
    expect(screen.queryByRole("link", { name: "New task" })).not.toBeInTheDocument();
  });
});
