import { getSchemaFields, type SchemaField } from "@/lib/json-schema";

function exampleValue(field: SchemaField): unknown {
  if (field.default !== undefined) return field.default;
  if (field.kind === "select") return field.options[0];
  if (field.kind === "slider") return field.min;
  if (field.kind === "url") return field.multiple ? ["https://example.com/file.mp4"] : "https://example.com/file.png";
  if (field.kind === "boolean") return false;
  return "...";
}

export function ApiTab({ toolName, schema }: { toolName: string; schema: Record<string, unknown> }) {
  const fields = getSchemaFields(schema);
  const exampleInput = Object.fromEntries(
    fields.filter((f) => f.required || f.default !== undefined).map((f) => [f.name, exampleValue(f)]),
  );

  const curl = [
    `curl -X POST ${process.env.NEXT_PUBLIC_API_URL}/api/v1/tools/${toolName}/runs \\`,
    `  -H "Authorization: Bearer YOUR_TOKEN" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${JSON.stringify({ input: exampleInput }, null, 2)}'`,
  ].join("\n");

  return (
    <div className="rounded-16 border border-border-secondary bg-surface-primary p-4">
      <h2 className="mb-2 text-sm font-semibold text-text-primary">Example request</h2>
      <p className="mb-3 text-xs text-text-secondary">No docs site yet — here&apos;s a curl example you can adapt.</p>
      <pre className="overflow-x-auto rounded-10 bg-surface-tertiary p-3 text-xs font-mono text-text-primary">
        <code>{curl}</code>
      </pre>
    </div>
  );
}
