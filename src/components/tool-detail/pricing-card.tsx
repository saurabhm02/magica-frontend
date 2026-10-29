import { EstimateBadge } from "./estimate-badge";

export function PricingCard({ lines, estimatedCredits }: { lines: string[]; estimatedCredits: number }) {
  return (
    <div className="mt-6 rounded-16 border border-border-secondary bg-surface-primary p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Pricing</h2>
        <EstimateBadge credits={estimatedCredits} />
      </div>
      <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
