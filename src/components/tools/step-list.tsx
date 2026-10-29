"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { formatCredits, formatSummaryLine } from "@/lib/constants";
import type { StepItem } from "@/lib/types";
import { useUiStore } from "@/stores/ui.store";

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

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isThinking = isLive && (status === "queued" || status === "thinking");
  const isWorking = isLive && status === "working";
  const isComplete = !isLive || status === "complete";

  const elapsedThinking = useElapsedTime(thinkingStartedAt, isThinking || isWorking);

  if (isThinking) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer select-none">
        <ChevronDown className="h-4 w-4" />
        <span>Thinking{elapsedThinking > 0 ? `… ${elapsedThinking}s` : ""}</span>
      </div>
    );
  }

  if (isWorking && steps.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <AnimatedDots />
        <span>Working {elapsedThinking}s</span>
        <ChevronDown className="h-4 w-4" />
      </div>
    );
  }

  if (steps.length === 0) return null;

  const activeStep = steps.find((s) => s.status === "running") || steps[steps.length - 1];
  const summaryText = formatSummaryLine(
    steps.map((s) => s.doneLabel || s.label || "").filter(Boolean),
  );

  return (
    <div className="flex flex-col gap-2 w-full max-w-[560px]">
      {isWorking && (
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
          <AnimatedDots />
          <span className="truncate">
            {activeStep?.label || "Working"} {elapsedThinking}s
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
          <span>{summaryText || "Completed steps"}</span>
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
              onToggle={(e) => toggleRow(step.id, e)}
              onClick={() => openStepArtifact(step)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StepRow({
  step,
  expanded,
  onToggle,
  onClick,
}: {
  step: StepItem;
  expanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const isRunning = step.status === "running";
  const elapsed = useElapsedTime(step.startedAt, isRunning);

  const formattedCredits = formatCredits(step.credits);
  const rightLabel = isRunning
    ? `${elapsed}s`
    : step.status === "succeeded"
    ? `${step.model ? `${step.model} · ` : ""}${formattedCredits ? `${formattedCredits}` : ""}`
    : "";

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={step.renderKey ? `step-row-${step.renderKey}` : `step-row-${step.id}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex flex-col cursor-pointer hover:bg-surface-secondary/50 transition px-3.5 py-2.5 text-sm select-none"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline min-w-0 truncate">
          <span className="text-text-secondary truncate">{step.label || "Step"}</span>
          {step.detail && (
            <span className="font-semibold text-text-primary ml-1.5 truncate">
              {step.detail}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-xs text-text-secondary">
          {isRunning && <span>{rightLabel}</span>}
          {step.status === "succeeded" && rightLabel && <span>{rightLabel}</span>}
          {step.status === "failed" && (
            <span className="flex items-center gap-1 text-error">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Failed</span>
            </span>
          )}
          <button
            type="button"
            aria-label="Toggle details"
            onClick={onToggle}
            className="p-0.5 text-text-secondary hover:text-text-primary rounded"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-border-secondary/60 flex flex-col gap-1.5 text-xs">
          {step.fields && step.fields.length > 0
            ? step.fields.map((f, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-text-secondary w-28 shrink-0">{f.label}</span>
                  <span className="text-text-primary font-mono truncate">{f.value}</span>
                </div>
              ))
            : step.model ? (
                <div className="flex gap-4">
                  <span className="text-text-secondary w-28 shrink-0">Model</span>
                  <span className="text-text-primary font-mono">{step.model}</span>
                </div>
              ) : null}
          {step.status === "succeeded" && formattedCredits && (
            <div className="flex gap-4">
              <span className="text-text-secondary w-28 shrink-0">Credits used</span>
              <span className="text-text-primary font-mono">{formattedCredits}</span>
            </div>
          )}
          {step.status === "failed" && step.error && (
            <div className="flex gap-4 text-error">
              <span className="w-28 shrink-0">Error</span>
              <span>{typeof step.error === "string" ? step.error : step.error.message}</span>
            </div>
          )}
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

function useElapsedTime(startedAt?: string, isRunning?: boolean) {
  const [elapsed, setElapsed] = useState(() => {
    if (!startedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  });

  useEffect(() => {
    if (!isRunning || !startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, isRunning]);

  return elapsed;
}
