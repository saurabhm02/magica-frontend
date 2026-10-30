"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { cleanReasoning } from "@/lib/reasoning";
import type { StepItem } from "@/lib/types";

// Magica's thinking row: grey, one line (the raw text until its title arrives), and
// expanding it shows the full thinking.
export function ReasoningRow({ step, expanded, onToggle }: { step: StepItem; expanded: boolean; onToggle: () => void }) {
  const text = cleanReasoning(step.text ?? "");
  return (
    <div data-testid="step-row-reasoning" className="flex flex-col px-3.5 py-2.5 text-sm hover:bg-surface-secondary/50 transition">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex items-center justify-between gap-3 text-left text-text-secondary"
      >
        <span className="min-w-0 truncate">{step.label || text}</span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
      </button>
      {expanded && (
        <p className="mt-1.5 max-h-60 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-text-tertiary">{text}</p>
      )}
    </div>
  );
}
