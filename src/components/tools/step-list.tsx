"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatSummaryLine } from "@/lib/constants";
import type { StepItem } from "@/lib/types";
import { useUiStore } from "@/stores/ui.store";
import { StatusLine } from "./status-line";
import { StepRow } from "./step-row";
import { useElapsedTime } from "./use-elapsed-time";

export type StepListProps = {
  steps: StepItem[];
  isLive?: boolean;
  status?: string;
  thinkingStartedAt?: string;
};

export function StepList({ steps, isLive, status, thinkingStartedAt }: StepListProps) {
  const openStepArtifact = useUiStore((s) => s.openStepArtifact);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isThinking = isLive && (status === "queued" || status === "thinking");
  const isWorking = isLive && status === "working";
  const isWaiting = isLive && status === "waiting";
  const isStopping = isLive && status === "stopping";
  const isCancelled = status === "cancelled";
  const isComplete = !isLive || status === "complete" || isCancelled;

  const elapsedThinking = useElapsedTime(thinkingStartedAt, isThinking || isWorking);

  if (isThinking) return <StatusLine status="thinking" elapsed={elapsedThinking} />;
  if (isWaiting) return <StatusLine status="waiting" />;
  if (isStopping) return <StatusLine status="stopping" />;

  if (isWorking && steps.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <AnimatedDots />
        <span>Working {elapsedThinking}s</span>
      </div>
    );
  }

  if (steps.length === 0) return null;

  const activeStep = steps.find((s) => s.status === "running") || steps[steps.length - 1];
  const summaryText = formatSummaryLine(steps.map((s) => s.doneLabel || s.label || "").filter(Boolean));

  return (
    <div className="flex flex-col gap-2 w-full max-w-[560px]">
      {isWorking && (
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <AnimatedDots />
          <span className="truncate">
            {activeStep?.label || "Working"} {elapsedThinking}s
          </span>
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

      {(isWorking || summaryExpanded) && (
        <div className="rounded-16 border border-border-secondary bg-surface-primary overflow-hidden divide-y divide-border-secondary">
          {steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              expanded={!!expandedRows[step.id]}
              onToggle={() => toggleRow(step.id)}
              onClick={() => openStepArtifact(step)}
            />
          ))}
        </div>
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
