import type { AssetItem } from "@/contracts/api";

export type AssetDayGroup = { label: string; items: AssetItem[] };

function dayLabel(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Assets arrive newest-first, so each new label starts a new group in order.
export function groupByDay(items: AssetItem[]): AssetDayGroup[] {
  const groups: AssetDayGroup[] = [];

  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.label === label) {
      lastGroup.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return groups;
}
