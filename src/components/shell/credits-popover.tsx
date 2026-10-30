"use client";

import { ArrowUpRight, ChartColumn, CircleDollarSign, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatCredits, NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { useClickOutside } from "@/lib/use-click-outside";

export function CreditsPopover({ balance, onClose }: { balance: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, true, onClose);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Credits"
      className="absolute top-full right-0 z-50 mt-2 w-80 rounded-20 border border-border-secondary bg-surface-primary p-4 shadow-lg"
    >
      <p className="text-xs font-semibold tracking-wide text-text-tertiary uppercase">Free</p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-text-secondary">Available Credits</span>
        <span className="text-lg font-semibold tabular-nums text-text-primary">{formatCredits(balance)}</span>
      </div>

      <Button disabled aria-disabled="true" title={NOT_AVAILABLE_TOOLTIP} className="mt-3 h-10 w-full rounded-12">
        <Wallet className="size-4" />
        Add Credits
      </Button>

      <p className="mt-4 text-xs font-semibold tracking-wide text-text-tertiary uppercase">Explore plans</p>

      <button
        type="button"
        aria-disabled="true"
        title={NOT_AVAILABLE_TOOLTIP}
        className="mt-2 flex w-full cursor-not-allowed items-center justify-between rounded-12 py-1 text-left"
      >
        <span>
          <span className="block text-sm font-medium text-text-primary">Compare plans</span>
          <span className="block text-xs text-text-tertiary">Find the right plan for you</span>
        </span>
        <ArrowUpRight className="size-4 shrink-0 text-text-tertiary" />
      </button>

      <div className="mt-3 flex items-center gap-2">
        <Link
          href="/usage"
          onClick={onClose}
          className="flex h-9 flex-1 items-center justify-between gap-1.5 rounded-full border border-border-secondary px-3 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        >
          View usage
          <ChartColumn className="size-4" />
        </Link>
        <button
          type="button"
          aria-disabled="true"
          title={NOT_AVAILABLE_TOOLTIP}
          className="flex h-9 flex-1 cursor-not-allowed items-center justify-between gap-1.5 rounded-full border border-border-secondary px-3 text-sm text-text-tertiary"
        >
          Billing details
          <CircleDollarSign className="size-4" />
        </button>
      </div>
    </div>
  );
}
