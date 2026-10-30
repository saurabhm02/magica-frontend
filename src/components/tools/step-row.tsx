"use client";

import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { formatCredits } from "@/lib/constants";
import type { StepItem } from "@/lib/types";
import { useElapsedTime } from "./use-elapsed-time";

// These render keys show longer, multi-line field values (a question + its answer, a
// plan step + its description), so they skip the default single-line/mono treatment.
const MULTILINE_FIELD_RENDER_KEYS = new Set(["request-user-options", "plan"]);

export function StepRow({
  step,
  expanded,
  onToggle,
  onClick,
}: {
  step: StepItem;
  expanded: boolean;
  onToggle: () => void;
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
      data-testid={step.renderKey ? `step-row-${step.renderKey}` : `step-row-${step.id}`}
      className="flex flex-col px-3.5 py-2.5 text-sm hover:bg-surface-secondary/50 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onClick} className="flex flex-1 items-baseline min-w-0 truncate text-left">
          <span className="text-text-secondary truncate">{step.label || "Step"}</span>
          {step.detail && <span className="font-semibold text-text-primary ml-1.5 truncate">{step.detail}</span>}
        </button>

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
            aria-expanded={expanded}
            onClick={onToggle}
            className="p-0.5 text-text-secondary hover:text-text-primary rounded"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {step.status === "failed" && step.error && !expanded && (
        <p className="mt-1.5 text-xs text-error">
          {typeof step.error === "string" ? step.error : step.error.message}
        </p>
      )}

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-border-secondary/60 flex flex-col gap-1.5 text-xs">
          {step.fields &&
            step.fields.length > 0 &&
            step.fields.map((f, i) =>
              MULTILINE_FIELD_RENDER_KEYS.has(step.renderKey) ? (
                <div key={i} className="flex gap-4">
                  <span className="text-text-secondary w-16 shrink-0">{f.label}</span>
                  <span className="text-text-primary whitespace-pre-line">{f.value}</span>
                </div>
              ) : (
                <div key={i} className="flex gap-4">
                  <span className="text-text-secondary w-28 shrink-0">{f.label}</span>
                  <span className="text-text-primary font-mono truncate">{f.value}</span>
                </div>
              ),
            )}
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

