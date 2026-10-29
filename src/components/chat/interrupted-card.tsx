import { Info } from "lucide-react";

export function InterruptedCard({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      aria-live="polite"
      className="flex w-full max-w-[560px] items-center justify-between gap-3 rounded-12 border border-border-secondary bg-surface-primary px-3.5 py-2.5 text-sm text-text-secondary"
    >
      <span className="flex items-center gap-1.5">
        <Info className="h-4 w-4 shrink-0" />
        Response was interrupted
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 text-text-primary underline">
          Retry
        </button>
      )}
    </div>
  );
}
