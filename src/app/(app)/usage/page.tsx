"use client";

import type { LedgerType } from "@/contracts/api";
import { formatCredits, formatRelativeTime } from "@/lib/constants";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useCreditLedger } from "@/queries/credits";

const LEDGER_LABELS: Record<LedgerType, string> = {
  grant: "Credit grant",
  reserve: "Hold",
  settle: "Charge",
  refund: "Refund",
};

export default function UsagePage() {
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useCreditLedger();
  const sentinelRef = useInfiniteScroll(hasNextPage, fetchNextPage);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="mx-auto max-w-[900px] p-6">
      <h1 className="text-2xl font-bold text-text-primary">Usage</h1>

      <div className="mt-6 flex flex-col gap-1">
        {isPending && <p className="text-sm text-text-secondary">Loading…</p>}
        {isError && <p className="text-sm text-text-secondary">Couldn&apos;t load usage.</p>}
        {data && items.length === 0 && <p className="text-sm text-text-secondary">No usage yet</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-10 px-3 py-3 hover:bg-surface-hover">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary">{LEDGER_LABELS[item.type]}</p>
              <p className="text-xs text-text-tertiary">{formatRelativeTime(item.createdAt)}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm tabular-nums text-text-primary">
                {item.amount >= 0 ? "+" : "-"}
                {formatCredits(Math.abs(item.amount))}
              </p>
              <p className="text-xs tabular-nums text-text-tertiary">{formatCredits(item.balanceAfter)}</p>
            </div>
          </div>
        ))}
        <div ref={sentinelRef} />
        {isFetchingNextPage && <p className="text-center text-xs text-text-tertiary">Loading more…</p>}
      </div>
    </div>
  );
}
