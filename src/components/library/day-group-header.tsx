import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";

export function DayGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center">
      <div className="flex shrink-0 flex-col">
        <h3 className="text-sm text-text-primary">{label}</h3>
        <span className="text-sm text-text-tertiary">{String(count).padStart(2, "0")} Items</span>
      </div>
      <div className="mx-3 h-px flex-1 bg-border-secondary" />
      <button
        type="button"
        aria-label={`Select all items from ${label}`}
        aria-disabled="true"
        title={NOT_AVAILABLE_TOOLTIP}
        className="size-5 shrink-0 cursor-not-allowed rounded-4 border-2 border-border-secondary"
      />
    </div>
  );
}
