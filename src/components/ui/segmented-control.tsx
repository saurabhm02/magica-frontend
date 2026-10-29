import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 rounded-full px-4 text-sm transition disabled:pointer-events-none disabled:opacity-40",
            value === option.value
              ? "bg-surface-tertiary text-text-primary"
              : "bg-surface-secondary text-text-secondary hover:bg-surface-hover",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
