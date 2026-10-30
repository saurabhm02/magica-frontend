"use client";

import { useState } from "react";
import { exampleInput, sampleCode, type ApiLanguage } from "@/lib/api-sample-code";
import { getSchemaFields } from "@/lib/json-schema";
import { ApiDocs } from "./api-docs";
import { CodeSample } from "./code-sample";

const RESPONSE_EXAMPLE = JSON.stringify(
  {
    id: "run_db_1",
    runId: "run_abc123",
    toolName: "{toolName}",
    status: "succeeded",
    output: { result: "https://..." },
    credits: 5000,
    assets: [{ type: "image", url: "https://..." }],
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  null,
  2,
);

export function ApiTab({
  toolName,
  schema,
  pricingLines,
  estimatedCredits,
}: {
  toolName: string;
  schema: Record<string, unknown>;
  pricingLines: string[];
  estimatedCredits: number;
}) {
  const [language, setLanguage] = useState<ApiLanguage>("python");
  const fields = getSchemaFields(schema);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const input = exampleInput(fields);
  const code = sampleCode(language, toolName, apiUrl, input);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-[720px]">
        <CodeSample language={language} onLanguageChange={setLanguage} code={code} />
      </div>
      <div className="overflow-y-auto">
        <ApiDocs
          toolName={toolName}
          apiUrl={apiUrl}
          fields={fields}
          responseExample={RESPONSE_EXAMPLE.replace("{toolName}", toolName)}
          pricingLines={pricingLines}
          estimatedCredits={estimatedCredits}
        />
      </div>
    </div>
  );
}
