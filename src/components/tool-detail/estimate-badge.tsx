import { CreditsSparkles } from "@/components/icons/credits-sparkles";
import { formatCredits } from "@/lib/constants";

export function EstimateBadge({ credits, loading }: { credits?: number; loading?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
      <CreditsSparkles className="size-3.5" />
      {loading || credits === undefined ? "Estimating…" : `~ ${formatCredits(credits)}`}
    </span>
  );
}
