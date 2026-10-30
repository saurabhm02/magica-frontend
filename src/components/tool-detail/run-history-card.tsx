"use client";

import { Clock, Coins, Copy, Loader2, Search } from "lucide-react";
import { useState } from "react";
import type { ToolRunHistoryItem, ToolStatus } from "@/contracts/api";
import { cn } from "@/lib/utils";
import { formatCredits } from "@/lib/constants";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useToolRuns } from "@/queries/tools";

const STATUS_STYLE: Record<ToolStatus, { label: string; className: string }> = {
  succeeded: { label: "Completed", className: "bg-success/15 text-success" },
  failed: { label: "Failed", className: "bg-error/15 text-error" },
  running: { label: "Running", className: "bg-info/15 text-info" },
  pending: { label: "Pending", className: "bg-surface-tertiary text-text-secondary" },
  cancelled: { label: "Cancelled", className: "bg-surface-tertiary text-text-secondary" },
};

function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour12: false });
  return `${date} ${time}`;
}

export function RunHistoryCard({
  toolName,
  activeRunId,
  onSelectRun,
}: {
  toolName: string;
  activeRunId?: string | null;
  onSelectRun?: (runId: string) => void;
}) {
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } = useToolRuns(toolName);
  const [tab, setTab] = useState<"ui" | "api">("ui");
  const [query, setQuery] = useState("");
  const sentinelRef = useInfiniteScroll(hasNextPage, fetchNextPage);

  const allRuns = data?.pages.flatMap((page) => page.items) ?? [];
  const runs = tab === "api" ? [] : allRuns.filter((run) => run.runId.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mt-6 rounded-24 border border-border-tertiary">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-tertiary bg-surface-main-background-2 px-[21px] py-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <Clock className="size-4" />
          Run History <span className="font-normal text-text-tertiary">({allRuns.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-7 items-center gap-1 rounded-full bg-surface-secondary p-1">
            {(["ui", "api"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
                className={cn(
                  "h-full w-[82px] rounded-full text-xs font-medium transition",
                  tab === value ? "bg-surface-tertiary text-text-primary" : "text-text-secondary hover:bg-surface-hover",
                )}
              >
                {value === "ui" ? "UI Runs" : "API Runs"}
              </button>
            ))}
          </div>
          <div className="relative w-[264px]">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Run ID..."
              className="h-8 w-full rounded-12 border border-border-tertiary bg-surface-primary pl-9 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {isPending && <p className="p-4 text-sm text-text-secondary">Loading…</p>}

      {!isPending && runs.length === 0 && <p className="p-4 text-sm text-text-secondary">No UI run yet.</p>}

      {runs.length > 0 && (
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[17%]" />
            <col className="w-[18%]" />
            <col className="w-[35%]" />
          </colgroup>
          <thead>
            <tr className="h-12 border-b border-border-tertiary text-left text-sm font-medium text-text-secondary">
              <th className="px-4">Date & Time</th>
              <th className="px-4">Status</th>
              <th className="px-4">Used credits</th>
              <th className="px-4 text-right">Run ID</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <RunRow key={run.runId} run={run} active={run.runId === activeRunId} onSelect={onSelectRun} />
            ))}
          </tbody>
        </table>
      )}

      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className="p-2 text-center text-xs text-text-tertiary">Loading more…</p>}
    </div>
  );
}

function RunRow({
  run,
  active,
  onSelect,
}: {
  run: ToolRunHistoryItem;
  active: boolean;
  onSelect?: (runId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const status = STATUS_STYLE[run.status];
  const isRunning = run.status === "pending" || run.status === "running";
  const shortId = run.runId.length > 18 ? `${run.runId.slice(0, 18)}…` : run.runId;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(run.runId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <tr
      onClick={() => onSelect?.(run.runId)}
      className={cn(
        "cursor-pointer border-b border-border-tertiary last:border-0 hover:bg-surface-main-background-2",
        active && "bg-surface-primary",
      )}
    >
      <td className="px-4 py-3 text-text-secondary">{formatDateTime(run.createdAt)}</td>
      <td className="px-4 py-3">
        {isRunning ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-warning">
            <Loader2 className="size-3 animate-spin" />
            Running
          </span>
        ) : (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", status.className)}>{status.label}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {isRunning ? (
          <span className="text-text-tertiary">—</span>
        ) : (
          <span className="flex w-fit items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
            <Coins className="size-3" />
            {formatCredits(run.credits)}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="max-w-[180px] truncate font-mono text-xs">{shortId}</span>
          <button type="button" aria-label="Copy run ID" onClick={handleCopy} className="flex size-6 items-center justify-center hover:text-text-primary">
            {copied ? "✓" : <Copy className="size-3.5" />}
          </button>
        </span>
      </td>
    </tr>
  );
}
