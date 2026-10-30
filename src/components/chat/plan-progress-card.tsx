import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { RunMetadata } from "@/contracts/run";
import { cn } from "@/lib/utils";

export function PlanProgressCard({ plan }: { plan: NonNullable<RunMetadata["plan"]> }) {
  return (
    <div className="w-full max-w-[560px] rounded-16 border border-border-secondary bg-surface-primary">
      <div className="flex items-center justify-between px-4 py-2.5 text-sm">
        <span className="truncate font-semibold text-text-primary">{plan.shortTitle || plan.title}</span>
        <span className="shrink-0 text-text-tertiary">
          {plan.done}/{plan.total}
        </span>
      </div>
      <div className="divide-y divide-border-secondary/60 border-t border-border-secondary">
        {plan.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2.5 px-4 py-2 text-sm">
            {step.status === "done" ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" />
            ) : step.status === "failed" ? (
              <XCircle className="size-4 shrink-0 text-error" />
            ) : step.status === "running" ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-text-tertiary" />
            ) : (
              <Circle className="size-4 shrink-0 text-text-tertiary" />
            )}
            <span className={cn("truncate", step.status === "done" ? "text-text-secondary" : "text-text-primary")}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
