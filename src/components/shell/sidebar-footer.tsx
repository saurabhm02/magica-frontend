"use client";

import { ArrowRight, EllipsisVertical, Settings, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { People } from "@/components/icons/people";
import { formatCredits, NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { useCredits } from "@/queries/credits";
import { ThemeToggle } from "./theme-toggle";
import { UserCard } from "./user-card";

const outlineButtonClassName =
  "flex items-center rounded-10 border border-border-tertiary bg-surface-main-background text-sm font-medium text-text-secondary transition-colors duration-75 hover:bg-surface-secondary hover:text-text-primary";

export function SidebarFooter() {
  // Magica starts with the footer folded ("More").
  const [expanded, setExpanded] = useState(false);
  const { data: credits } = useCredits();

  return (
    <div className="shrink-0 border-t border-border-tertiary px-2 text-[13px] leading-[19.5px]">
      <div className="py-1">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="flex h-[34px] w-full items-center gap-2.5 rounded-10 px-2 text-sm text-text-secondary transition-colors duration-75 hover:bg-surface-secondary hover:text-text-primary"
        >
          <EllipsisVertical className="size-4" strokeWidth={1.75} />
          {expanded ? "Less" : "More"}
        </button>
      </div>

      <div
        className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr", opacity: expanded ? 1 : 0 }}
      >
        <div className="min-h-0" inert={!expanded}>
          <div className="flex items-center justify-between gap-2 px-2 text-xs leading-4">
            <span className="text-text-primary/50">Available Credits</span>
            <Link
              href="/usage"
              className="font-medium tabular-nums text-text-secondary underline-offset-2 transition-colors hover:text-text-primary hover:underline"
            >
              {credits ? formatCredits(credits.balance) : "—"}
            </Link>
          </div>

          <button
            type="button"
            aria-disabled="true"
            title={NOT_AVAILABLE_TOOLTIP}
            className="mt-2 flex h-8 w-full items-center justify-center gap-[7px] rounded-10 bg-gradient-to-b from-primary-top to-primary-bottom px-4 text-xs font-medium text-white shadow-[0_0_0_1px_#303030,inset_0_1px_rgba(255,255,255,0.15),0_1px_3px_rgba(0,0,0,0.2)]"
          >
            <Wallet className="size-3.5" strokeWidth={1.8} />
            Add Credits
          </button>

          <div className="mt-3 flex items-center gap-2">
            {[
              { label: "Settings", icon: Settings },
              { label: "Updates", icon: Sparkles },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                aria-disabled="true"
                title={NOT_AVAILABLE_TOOLTIP}
                className={`${outlineButtonClassName} h-8 min-w-0 flex-1 justify-center gap-1.5`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-disabled="true"
            title={NOT_AVAILABLE_TOOLTIP}
            className={`${outlineButtonClassName} mt-2 mb-3 h-[34px] w-full justify-between px-2`}
          >
            <span className="flex items-center gap-2.5">
              <People className="size-4" />
              Invite team members
            </span>
            <ArrowRight className="size-3.5" />
          </button>

          <div className="my-1">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="pt-0.5 pb-2">
        <UserCard />
      </div>
    </div>
  );
}
