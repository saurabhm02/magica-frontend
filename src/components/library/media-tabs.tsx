import { Heart, LayoutGrid, Sparkles, UploadCloud } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaTab = "all" | "generated" | "uploads" | "favorites";

const TABS: { value: MediaTab; label: string; icon: LucideIcon }[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "generated", label: "Generated", icon: Sparkles },
  { value: "uploads", label: "My Uploads", icon: UploadCloud },
  { value: "favorites", label: "Favorites", icon: Heart },
];

export function MediaTabs({ value, onChange }: { value: MediaTab; onChange: (tab: MediaTab) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto">
      {TABS.map((tab) => {
        const selected = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex h-8 shrink-0 items-center gap-[7px] rounded-full border px-3 text-sm whitespace-nowrap",
              selected
                ? "border-border-secondary bg-surface-tertiary font-semibold text-text-primary"
                : "border-transparent bg-surface-secondary font-medium text-text-secondary hover:bg-surface-hover",
            )}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
