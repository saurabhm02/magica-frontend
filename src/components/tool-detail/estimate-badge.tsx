import { Loader2 } from "lucide-react";
import { CreditsSparkles } from "@/components/icons/credits-sparkles";
import { formatCredits } from "@/lib/constants";

export function EstimateBadge({ credits, loading }: { credits?: number; loading?: boolean }) {
  const isEstimating = loading || credits === undefined;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
      {isEstimating ? <Loader2 className="size-3.5 animate-spin" /> : <CreditsSparkles className="size-3.5" />}
      {isEstimating ? "Estimating…" : `~ ${formatCredits(credits)}`}
    </span>
  );
}
