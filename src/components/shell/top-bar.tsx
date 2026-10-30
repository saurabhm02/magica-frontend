"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FINAL_STATUSES, formatCredits } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useLiveRunStore } from "@/stores/live-run.store";
import { useCredits } from "@/queries/credits";
import { CreditsSparkles } from "@/components/icons/credits-sparkles";
import { CreditsPopover } from "./credits-popover";
import { MobileSidebar } from "./mobile-sidebar";

export function TopBar() {
  const { data } = useCredits();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const balanceText = data?.balance !== undefined ? formatCredits(data.balance) : "—";
  // Like Magica, the model selector is greyed out while this chat's run is going.
  const chatId = usePathname().match(/^\/chat\/([^/]+)/)?.[1];
  const runActive = useLiveRunStore((s) => {
    const run = chatId ? s.runs[chatId] : undefined;
    return !!run && !FINAL_STATUSES.includes(run.status);
  });

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between pr-6 pl-4">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <button
          type="button"
          disabled={runActive}
          className={cn(
            "flex h-7 items-center gap-2 rounded-10 px-2 text-sm text-text-primary transition-[color,background-color,opacity] duration-75 hover:bg-surface-secondary",
            runActive && "pointer-events-none opacity-50",
          )}
        >
          OpenRouter Free
          <ChevronDown className="size-3.5 text-text-secondary" />
        </button>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setPopoverOpen(true)}
        onMouseLeave={() => setPopoverOpen(false)}
      >
        <button
          type="button"
          data-testid="top-bar-credits"
          aria-expanded={popoverOpen}
          onFocus={() => setPopoverOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-full border border-border-tertiary px-3 text-sm text-text-primary transition-colors duration-75 hover:bg-surface-secondary"
        >
          <CreditsSparkles className="size-4 text-text-secondary" />
          <span>{balanceText}</span>
        </button>
        {popoverOpen && data && <CreditsPopover balance={data.balance} onClose={() => setPopoverOpen(false)} />}
      </div>
    </header>
  );
}
