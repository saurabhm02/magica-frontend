import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NewChatPage from "@/app/page";

describe("NewChatPage", () => {
  it("renders the new chat placeholder", () => {
    render(<NewChatPage />);
    expect(screen.getByText("New chat")).toBeInTheDocument();
  });
});
