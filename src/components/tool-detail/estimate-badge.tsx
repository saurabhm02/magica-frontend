import { Coins, Loader2 } from "lucide-react";
import { formatCredits } from "@/lib/constants";

export function EstimateBadge({ credits, loading }: { credits?: number; loading?: boolean }) {
  const isEstimating = loading || credits === undefined;
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-medium text-text-primary">
      {isEstimating ? (
        <Loader2 className="size-3.5 animate-spin text-warning" />
      ) : (
        <Coins className="size-3.5 text-warning" />
      )}
      {isEstimating ? "Estimating…" : `~ ${formatCredits(credits)}`}
    </span>
  );
}
