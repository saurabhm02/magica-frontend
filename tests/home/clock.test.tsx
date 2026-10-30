import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Clock } from "@/components/home/clock";

describe("Clock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 17, 56));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the time and the am/pm period in separate elements", () => {
    render(<Clock />);

    expect(screen.getByText("5:56")).toBeInTheDocument();
    expect(screen.getByText("pm")).toBeInTheDocument();
  });
});
