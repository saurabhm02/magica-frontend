"use client";

import { ListChecks, MessageSquare, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RespondWaitpointInput } from "@/contracts/api";
import { CreditsSparkles } from "@/components/icons/credits-sparkles";
import { Button } from "@/components/ui/button";
import { formatCredits } from "@/lib/constants";
import type { Plan } from "@/lib/waitpoint";
import { useRespondWaitpoint } from "@/queries/messages";
import { useLiveRunStore } from "@/stores/live-run.store";

function Credits({ credits }: { credits?: number }) {
  if (credits === undefined) return null;
  return (
    <span className="flex shrink-0 items-center gap-1 text-sm text-text-secondary">
      <CreditsSparkles className="size-3.5" />
      {`~${formatCredits(credits, { precision: 4 })}`}
    </span>
  );
}

export function PlanCard({ chatId, waitpointId, plan }: { chatId: string; waitpointId: string; plan: Plan }) {
  const [submitting, setSubmitting] = useState(false);
  const [requestChangesOpen, setRequestChangesOpen] = useState(false);
  const [requestChangesText, setRequestChangesText] = useState("");
  const clearWaitpoint = useLiveRunStore((s) => s.clearWaitpoint);
  const respond = useRespondWaitpoint(chatId);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  const totalCredits = plan.totalEstimatedCredits ?? plan.steps.reduce((sum, s) => sum + (s.estimatedCredits ?? 0), 0);

  const submit = async (body: RespondWaitpointInput) => {
    setSubmitting(true);
    try {
      await respond.mutateAsync({ waitpointId, body });
      clearWaitpoint(chatId);
    } catch {
      setSubmitting(false);
    }
  };

  const handleRunAll = () => submit({ action: "run_all" });
  const handleStepByStep = () => submit({ action: "step_by_step" });
  const handleRequestChangesSubmit = () => {
    if (requestChangesText.trim()) submit({ request_changes: requestChangesText.trim() });
  };

  return (
    <div
      ref={cardRef}
      data-testid="plan-card"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !requestChangesOpen && !submitting) {
          e.preventDefault();
          handleRunAll();
        }
      }}
      className="w-full max-w-[900px] rounded-24 border border-border-secondary bg-surface-primary focus:outline-none"
    >
      <div className="px-5 py-4">
        <h2 className="text-base font-semibold text-text-primary">{plan.title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{plan.overview}</p>
      </div>

      <div className="divide-y divide-border-secondary/60 border-t border-border-secondary">
        {plan.steps.map((step, i) => (
          <div key={i} className="flex items-start justify-between gap-4 px-5 py-3.5">
            <div className="flex min-w-0 items-baseline gap-3">
              <span className="shrink-0 text-sm text-text-tertiary">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">{step.title}</p>
                <p className="mt-0.5 text-sm text-text-secondary">{step.description}</p>
              </div>
            </div>
            <Credits credits={step.estimatedCredits} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-secondary px-5 py-3">
        <span className="text-sm text-text-secondary">Estimated total</span>
        <span className="flex items-center gap-1 text-sm text-text-primary">
          <CreditsSparkles className="size-3.5" />
          {`~${formatCredits(totalCredits, { precision: 4 })} credits`}
        </span>
      </div>

      <div className="border-t border-border-secondary px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <kbd className="rounded-6 border border-border-secondary px-1.5 py-0.5">Enter</kbd>
            run all
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => setRequestChangesOpen((v) => !v)}
            >
              <MessageSquare />
              Request Changes
            </Button>
            <Button type="button" variant="secondary" disabled={submitting} onClick={handleStepByStep}>
              <ListChecks />
              Step by Step
            </Button>
            <Button type="button" disabled={submitting} onClick={handleRunAll}>
              <Play />
              Run All
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-text-tertiary">
          Have a question first? Send it as a message. Nothing runs until you choose.
        </p>
      </div>

      {requestChangesOpen && (
        <div className="flex items-center gap-2 border-t border-border-secondary px-5 py-3">
          <input
            autoFocus
            value={requestChangesText}
            onChange={(e) => setRequestChangesText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRequestChangesSubmit();
              }
            }}
            disabled={submitting}
            placeholder="What would you like to change?"
            className="flex-1 rounded-10 border border-border-secondary bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <Button type="button" disabled={submitting || !requestChangesText.trim()} onClick={handleRequestChangesSubmit}>
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}
