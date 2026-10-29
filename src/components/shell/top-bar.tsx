"use client";

import { ChevronDown } from "lucide-react";
import { formatCredits } from "@/lib/constants";
import { useCredits } from "@/queries/credits";
import { CreditsSparkles } from "@/components/icons/credits-sparkles";
import { MobileSidebar } from "./mobile-sidebar";

export function TopBar() {
  const { data } = useCredits();
  const balanceText = data?.balance !== undefined ? formatCredits(data.balance) : "—";

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

      <div
        data-testid="top-bar-credits"
        className="flex h-8 items-center gap-1.5 rounded-full bg-surface-secondary px-3 text-sm text-text-primary"
      >
        <CreditsSparkles className="size-4 text-text-secondary" />
        <span>{balanceText}</span>
      </div>
    </header>
  );
}
