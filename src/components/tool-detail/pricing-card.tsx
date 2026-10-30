import { EstimateBadge } from "./estimate-badge";

export function PricingCard({ lines, estimatedCredits }: { lines: string[]; estimatedCredits: number }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base text-text-primary">Pricing</h2>
        <EstimateBadge credits={estimatedCredits} />
      </div>
      <div className="rounded-12 border border-border-tertiary bg-surface-main-background-2 p-4">
        <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
