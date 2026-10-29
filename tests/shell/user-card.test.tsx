import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserCard } from "@/components/shell/user-card";
import { useLiveRunStore } from "@/stores/live-run.store";
import { useUiStore } from "@/stores/ui.store";

const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockPush = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      id: "user_test",
      fullName: "Test User",
      imageUrl: "https://example.com/avatar.png",
      primaryEmailAddress: { emailAddress: "test@example.com" },
    },
  }),
  useClerk: () => ({
    signOut: mockSignOut,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("UserCard & Logout", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    useLiveRunStore.setState({
      runs: {
        chat_1: { status: "complete", text: "hi" },
      },
    });
    useUiStore.setState({
      sidebarCollapsed: true,
      mobileDrawerOpen: true,
      artifactPanel: { step: { id: "step_1", name: "test", renderKey: "test", status: "succeeded" } },
    });
  });

  function renderUserCard() {
    return render(
      <QueryClientProvider client={queryClient}>
        <UserCard />
      </QueryClientProvider>,
    );
  }

  it("renders user information", () => {
    renderUserCard();
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("opens menu and logs out: clears cache, resets stores, calls signOut and redirects", async () => {
    renderUserCard();

    // Click menu button
    const menuBtn = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(menuBtn);

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    const logoutBtn = screen.getByTestId("logout-button");
    expect(logoutBtn).toBeInTheDocument();

    const clearSpy = vi.spyOn(queryClient, "clear");

    fireEvent.click(logoutBtn);

    // Verify cache cleared
    expect(clearSpy).toHaveBeenCalled();

    // Verify stores reset
    expect(useLiveRunStore.getState().runs).toEqual({});
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    expect(useUiStore.getState().mobileDrawerOpen).toBe(false);
    expect(useUiStore.getState().artifactPanel).toBeNull();

    // Verify signOut and redirect called
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: "/sign-in" });
      expect(mockPush).toHaveBeenCalledWith("/sign-in");
    });
  });
});
