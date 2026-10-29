import { describe, expect, it } from "vitest";
import { groupByDay } from "@/components/library/group-by-day";

function asset(createdAt: string, url = `https://example.com/${createdAt}.png`) {
  return { url, type: "image" as const, chatId: "c1", toolName: "gpt_image_2", createdAt };
}

describe("groupByDay", () => {
  it("groups assets by calendar day, newest first", () => {
    const now = new Date();
    const todayMorning = new Date(now);
    todayMorning.setHours(9, 0, 0, 0);
    const todayAfternoon = new Date(now);
    todayAfternoon.setHours(15, 0, 0, 0);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    const items = [todayAfternoon, todayMorning, yesterday].map((d) => asset(d.toISOString()));
    const groups = groupByDay(items);

    expect(groups).toHaveLength(2);
    const [today, yesterdayGroup] = groups;
    expect(today?.label).toBe("Today");
    expect(today?.items).toHaveLength(2);
    expect(yesterdayGroup?.label).toBe("Yesterday");
    expect(yesterdayGroup?.items).toHaveLength(1);
  });

  it("starts a new group when the day changes, even if it repeats later", () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const items = [asset(now.toISOString(), "a"), asset(yesterday.toISOString(), "b"), asset(now.toISOString(), "c")];
    const groups = groupByDay(items);

    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Today"]);
  });
});
