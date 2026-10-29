import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserCard } from "@/components/shell/user-card";
import { useLiveRunStore } from "@/stores/live-run.store";
import { useUiStore } from "@/stores/ui.store";

const mockSignOut = vi.fn().mockResolvedValue(undefined);

const mockUser = {
  current: {
    id: "user_test",
    fullName: "Test User",
    imageUrl: "https://example.com/avatar.png",
    primaryEmailAddress: { emailAddress: "test@example.com" },
  },
};

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: mockUser.current }),
  useClerk: () => ({
    signOut: mockSignOut,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("UserCard & Logout", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.current = {
      id: "user_test",
      fullName: "Test User",
      imageUrl: "https://example.com/avatar.png",
      primaryEmailAddress: { emailAddress: "test@example.com" },
    };
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

  it("falls back to the email prefix when fullName is empty", () => {
    mockUser.current = {
      id: "user_test",
      fullName: "",
      imageUrl: "https://example.com/avatar.png",
      primaryEmailAddress: { emailAddress: "akshat.anand@example.com" },
    };
    renderUserCard();
    expect(screen.getByText("akshat.anand")).toBeInTheDocument();
  });

  it("falls back to the first letter of the name when there's no avatar image", () => {
    mockUser.current = {
      id: "user_test",
      fullName: "",
      imageUrl: "",
      primaryEmailAddress: { emailAddress: "akshat.anand@example.com" },
    };
    renderUserCard();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("logs out: awaits signOut first, then clears cache and resets stores", async () => {
    renderUserCard();

    const menuBtn = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(menuBtn);

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    const logoutBtn = screen.getByTestId("logout-button");
    expect(logoutBtn).toBeInTheDocument();

    const callOrder: string[] = [];
    mockSignOut.mockImplementationOnce(async () => {
      callOrder.push("signOut");
    });
    const clearSpy = vi.spyOn(queryClient, "clear").mockImplementationOnce(() => {
      callOrder.push("clear");
    });

    fireEvent.click(logoutBtn);

    await waitFor(() => expect(clearSpy).toHaveBeenCalled());
    expect(callOrder).toEqual(["signOut", "clear"]);

    expect(useLiveRunStore.getState().runs).toEqual({});
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    expect(useUiStore.getState().mobileDrawerOpen).toBe(false);
    expect(useUiStore.getState().artifactPanel).toBeNull();
    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: "/sign-in" });
  });
});
