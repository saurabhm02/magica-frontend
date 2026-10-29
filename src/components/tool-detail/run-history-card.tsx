"use client";

import { Clock, Copy } from "lucide-react";
import { useState } from "react";
import type { ToolRunHistoryItem, ToolStatus } from "@/contracts/api";
import { cn } from "@/lib/utils";
import { formatCredits } from "@/lib/constants";
import { useInfiniteScroll } from "@/lib/use-infinite-scroll";
import { useToolRuns } from "@/queries/tools";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";

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

export function RunHistoryCard({ toolName }: { toolName: string }) {
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } = useToolRuns(toolName);
  const [tab, setTab] = useState<"ui" | "api">("ui");
  const [query, setQuery] = useState("");
  const sentinelRef = useInfiniteScroll(hasNextPage, fetchNextPage);

  const allRuns = data?.pages.flatMap((page) => page.items) ?? [];
  const runs = tab === "api" ? [] : allRuns.filter((run) => run.runId.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mt-6 rounded-16 border border-border-secondary bg-surface-primary">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-secondary p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <Clock className="size-4" />
          Run History <span className="font-normal text-text-tertiary">({allRuns.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { label: "UI Runs", value: "ui" },
              { label: "API Runs", value: "api" },
            ]}
          />
          <div className="w-56">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by Run ID..." />
          </div>
        </div>
      </div>

      {isPending && <p className="p-4 text-sm text-text-secondary">Loading…</p>}

      {!isPending && runs.length === 0 && <p className="p-4 text-sm text-text-secondary">No UI run yet.</p>}

      {runs.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-secondary text-left text-xs text-text-secondary">
              <th className="px-4 py-2.5 font-medium">Date & Time</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Used credits</th>
              <th className="px-4 py-2.5 text-right font-medium">Run ID</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <RunRow key={run.runId} run={run} />
            ))}
          </tbody>
        </table>
      )}

      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className="p-2 text-center text-xs text-text-tertiary">Loading more…</p>}
    </div>
  );
}

function RunRow({ run }: { run: ToolRunHistoryItem }) {
  const [copied, setCopied] = useState(false);
  const status = STATUS_STYLE[run.status];
  const shortId = run.runId.length > 18 ? `${run.runId.slice(0, 18)}…` : run.runId;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(run.runId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <tr className="border-b border-border-secondary last:border-0">
      <td className="px-4 py-3 text-text-primary">{formatDateTime(run.createdAt)}</td>
      <td className="px-4 py-3">
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", status.className)}>{status.label}</span>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
          {formatCredits(run.credits)}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-xs">{shortId}</span>
          <button type="button" aria-label="Copy run ID" onClick={handleCopy} className="hover:text-text-primary">
            {copied ? "✓" : <Copy className="size-3.5" />}
          </button>
        </span>
      </td>
    </tr>
  );
}
