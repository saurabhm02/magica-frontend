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
    <div className="inline-flex h-8 items-center gap-1 rounded-full bg-surface-secondary p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 rounded-full px-4 text-sm font-normal transition disabled:pointer-events-none disabled:opacity-40",
            value === option.value
              ? "bg-surface-primary text-text-primary shadow-sm"
              : "text-text-secondary hover:bg-surface-hover",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
