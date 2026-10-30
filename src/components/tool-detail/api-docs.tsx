import type { ToolStatus } from "@/contracts/api";
import { cn } from "@/lib/utils";
import type { SchemaField } from "@/lib/json-schema";
import { EstimateBadge } from "./estimate-badge";

const STATUS_STYLE: Record<ToolStatus, string> = {
  pending: "bg-surface-tertiary text-text-secondary",
  running: "bg-surface-tertiary text-text-secondary",
  succeeded: "bg-success/15 text-success",
  failed: "bg-error/15 text-error",
  cancelled: "bg-error/15 text-error",
};

const STATUSES: ToolStatus[] = ["pending", "running", "succeeded", "failed", "cancelled"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-secondary pt-5 first:border-0 first:pt-0">
      <h2 className="mb-3 text-sm font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function MethodBadge({ method, className }: { method: "POST" | "GET"; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-6 px-2 py-0.5 text-xs font-semibold",
        method === "POST" ? "bg-success/15 text-success" : "bg-info/15 text-info",
        className,
      )}
    >
      {method}
    </span>
  );
}

function ParameterRow({ field }: { field: SchemaField }) {
  const limits = [
    field.default !== undefined && `Default: ${JSON.stringify(field.default)}`,
    field.kind === "slider" && `Min: ${field.min}`,
    field.kind === "slider" && `Max: ${field.max}`,
  ].filter(Boolean);

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-text-primary">{field.name}</span>
        <span className="text-xs text-text-tertiary">{field.kind === "url" ? "string" : field.kind === "select" ? "string" : field.kind}</span>
        {field.required ? (
          <span className="rounded-6 bg-info/15 px-1.5 py-0.5 text-xs font-medium text-info">required</span>
        ) : (
          <span className="rounded-6 bg-surface-tertiary px-1.5 py-0.5 text-xs text-text-secondary">optional</span>
        )}
      </div>
      {field.description && <p className="mt-1 text-sm text-text-secondary">{field.description}</p>}
      {limits.length > 0 && <p className="mt-1 text-xs text-text-tertiary">{limits.join("  ")}</p>}
    </div>
  );
}

export function ApiDocs({
  toolName,
  apiUrl,
  fields,
  responseExample,
  pricingLines,
  estimatedCredits,
}: {
  toolName: string;
  apiUrl: string;
  fields: SchemaField[];
  responseExample: string;
  pricingLines: string[];
  estimatedCredits: number;
}) {
  const runUrl = `${apiUrl}/api/v1/tools/${toolName}/runs`;
  const pollUrl = `${apiUrl}/api/v1/tool-runs/{runId}`;

  return (
    <div className="flex flex-col gap-5 rounded-16 border border-border-secondary bg-surface-primary p-5">
      <Section title="API Endpoint">
        <div className="flex items-center gap-2 rounded-10 bg-surface-secondary px-3 py-2.5">
          <MethodBadge method="POST" />
          <span className="font-mono text-sm break-all text-text-primary">{runUrl}</span>
        </div>
      </Section>

      <Section title="Parameters">
        <div className="divide-y divide-border-secondary">
          {fields.map((field) => (
            <ParameterRow key={field.name} field={field} />
          ))}
        </div>
      </Section>

      <Section title="Response Format">
        <p className="text-sm text-text-secondary">
          The start endpoint returns a <code className="font-mono text-text-primary">runId</code>. Poll{" "}
          <code className="font-mono text-text-primary">GET /tool-runs/{"{runId}"}</code> to check status and get output.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-10 bg-surface-secondary p-3 font-mono text-xs text-text-primary">{responseExample}</pre>
      </Section>

      <Section title="Polling for Result">
        <div className="flex items-center gap-2 rounded-10 bg-surface-secondary px-3 py-2.5">
          <MethodBadge method="GET" />
          <span className="font-mono text-sm break-all text-text-primary">{pollUrl}</span>
        </div>
        <p className="mt-3 text-sm text-text-secondary">Poll every 5 seconds until status is terminal:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <span key={status} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLE[status])}>
              {status.toUpperCase()}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Pricing">
        <div className="flex items-center justify-between gap-3">
          <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
            {pricingLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <EstimateBadge credits={estimatedCredits} />
        </div>
      </Section>
    </div>
  );
}
