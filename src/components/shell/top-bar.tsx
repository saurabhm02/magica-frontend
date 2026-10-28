import { ChevronDown, Gem } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

export function TopBar() {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-full bg-surface-secondary px-3 text-sm text-text-primary hover:bg-surface-hover"
        >
          OpenRouter Free
          <ChevronDown className="size-3.5 text-text-secondary" />
        </button>
      </div>

      <div className="flex h-8 items-center gap-1.5 rounded-full bg-surface-secondary px-3 text-sm text-text-primary">
        <Gem className="size-4 text-text-secondary" />—
      </div>
    </header>
  );
}
