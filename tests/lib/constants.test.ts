import { describe, expect, it } from "vitest";
import { formatCredits } from "@/lib/constants";

describe("formatCredits", () => {
  it("shows 3 decimals for values under 0.01M, so small prices don't double", () => {
    expect(formatCredits(5000)).toBe("0.005M");
  });

  it("shows 2 decimals for values at or above 0.01M", () => {
    expect(formatCredits(273936)).toBe("0.27M");
    expect(formatCredits(18450000)).toBe("18.45M");
  });

  it("shows up to 4 decimals and drops trailing zeros when a precision is requested", () => {
    expect(formatCredits(140200, { precision: 4 })).toBe("0.1402M");
    expect(formatCredits(145200, { precision: 4 })).toBe("0.1452M");
    expect(formatCredits(5000, { precision: 4 })).toBe("0.005M");
  });
});
