import { cn } from "@/lib/utils";

export type CategoryFilter = "all" | "video" | "image" | "audio" | "llm" | "util";

const CHIPS: { label: string; value: CategoryFilter }[] = [
  { label: "All", value: "all" },
  { label: "Video", value: "video" },
  { label: "Image", value: "image" },
  { label: "Audio", value: "audio" },
  { label: "LLMs", value: "llm" },
  { label: "Utils", value: "util" },
];

export function CategoryChips({ value, onChange }: { value: CategoryFilter; onChange: (value: CategoryFilter) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <button
          key={chip.value}
          type="button"
          aria-pressed={value === chip.value}
          onClick={() => onChange(chip.value)}
          className={cn(
            "h-9 rounded-full px-4 text-sm transition",
            value === chip.value
              ? "bg-surface-tertiary text-text-primary"
              : "bg-surface-secondary text-text-secondary hover:bg-surface-hover",
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
