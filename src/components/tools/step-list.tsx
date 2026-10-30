"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatSummaryLine } from "@/lib/constants";
import { isReasoningStep, REASONING_RENDER_KEY, thinkingInProgress } from "@/lib/reasoning";
import type { StepItem } from "@/lib/types";
import { useUiStore } from "@/stores/ui.store";
import { ReasoningRow } from "./reasoning-row";
import { StatusLine } from "./status-line";
import { StepRow } from "./step-row";
import { useElapsedTime } from "./use-elapsed-time";

export type StepListProps = {
  steps: StepItem[];
  isLive?: boolean;
  status?: string;
  thinkingStartedAt?: string;
  reasoning?: string;
};

/**
 * Shows what the agent did or is doing for one reply: tool steps and reasoning rows.
 *
 * Input:
 * - steps: tool and reasoning steps in order
 * - isLive: true while the run is still going
 * - status: the run status
 * - thinkingStartedAt: start time for the elapsed timer
 * - reasoning: the live reasoning stream
 *
 * Output:
 * - A status line while thinking or stopping, a live header and step list while working,
 *   or a collapsible summary once done. Null if there are no tool steps.
 *
 * Notes:
 * - While working, thinking for the next step shows as an extra grey row at the end.
 * - Reasoning rows never count toward the summary line.
 */
export function StepList({ steps, isLive, status, thinkingStartedAt, reasoning }: StepListProps) {
  const openStepArtifact = useUiStore((s) => s.openStepArtifact);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isThinking = isLive && (status === "queued" || status === "thinking");
  const isWaiting = isLive && status === "waiting";
  const isActive = isLive && (status === "working" || isWaiting);
  const isStopping = isLive && status === "stopping";
  const isCancelled = status === "cancelled";
  const isComplete = !isLive || status === "complete" || isCancelled;

  const elapsedThinking = useElapsedTime(thinkingStartedAt, isActive);

  if (isThinking) return <StatusLine status="thinking" reasoning={reasoning} />;
  if (isStopping) return <StatusLine status="stopping" />;

  // No tool steps yet: Magica keeps "Thinking" while the reply text streams in.
  if (isActive && steps.length === 0) {
    return isWaiting ? <StatusLine status="waiting" /> : <StatusLine status="thinking" reasoning={reasoning} />;
  }

  // Reasoning rows sit between tool rows but, like Magica, never count toward the summary.
  const toolSteps = steps.filter((s) => !isReasoningStep(s));
  if (toolSteps.length === 0) return null;

  // Like Magica, the model's thinking for the next step streams in as a grey row at the end,
  // so the list never sits still between steps.
  const thinkingNow = isActive && !isWaiting ? thinkingInProgress(reasoning, steps) : "";
  const rows: StepItem[] = thinkingNow
    ? [...steps, { id: "reasoning_live", name: REASONING_RENDER_KEY, renderKey: REASONING_RENDER_KEY, status: "running", text: thinkingNow }]
    : steps;

  // Header: the running step, "Working" while it thinks, else the newest reasoning title
  // (Magica keeps "Decided to …" up while the reply streams), else the last step.
  const latestReasoningTitle = steps.filter((s) => isReasoningStep(s) && s.label).at(-1)?.label;
  const runningLabel = steps.find((s) => s.status === "running")?.label;
  const headerLabel = runningLabel || (thinkingNow && "Working") || latestReasoningTitle || steps.at(-1)?.label;
  const summaryText = formatSummaryLine(toolSteps.map((s) => s.doneLabel || s.label || "").filter(Boolean));

  return (
    <div className="flex flex-col gap-2 w-full max-w-[560px]">
      {isActive && (
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <AnimatedDots />
          <span className="truncate">
            {headerLabel || "Working"} {elapsedThinking}s
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </div>
      )}

      {isComplete && (
        <button
          type="button"
          onClick={() => setSummaryExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition cursor-pointer select-none py-1"
        >
          <span>{isCancelled ? (summaryText ? `${summaryText} (Stopped)` : "Stopped") : summaryText || "Completed steps"}</span>
          {summaryExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
      )}

      {(isActive || summaryExpanded) && (
        <div className="rounded-16 border border-border-secondary bg-surface-primary overflow-hidden divide-y divide-border-secondary">
          {rows.map((step) =>
            isReasoningStep(step) ? (
              <ReasoningRow key={step.id} step={step} expanded={!!expandedRows[step.id]} onToggle={() => toggleRow(step.id)} />
            ) : (
              <StepRow
                key={step.id}
                step={step}
                expanded={!!expandedRows[step.id]}
                onToggle={() => toggleRow(step.id)}
                onClick={() => openStepArtifact(step)}
              />
            ),
          )}
        </div>
      )}

      {isWaiting && (
        <p aria-live="polite" className="animate-pulse text-sm text-text-secondary">
          Waiting for your input...
        </p>
      )}
    </div>
  );
}

function AnimatedDots() {
  return (
    <span className="inline-flex items-center gap-0.5 text-text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-pulse" />
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-pulse [animation-delay:200ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-pulse [animation-delay:400ms]" />
    </span>
  );
}
