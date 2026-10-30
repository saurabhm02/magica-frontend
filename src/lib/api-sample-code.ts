import type { SchemaField } from "./json-schema";

export type ApiLanguage = "python" | "cURL" | "JavaScript";
export const API_LANGUAGES: ApiLanguage[] = ["python", "cURL", "JavaScript"];

function exampleValue(field: SchemaField): unknown {
  if (field.default !== undefined) return field.default;
  if (field.kind === "select") return field.options[0];
  if (field.kind === "slider") return field.min;
  if (field.kind === "url") return field.multiple ? ["https://example.com/file.mp4"] : "https://example.com/image.png";
  if (field.kind === "boolean") return false;
  return "...";
}

export function exampleInput(fields: SchemaField[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.filter((f) => f.required || f.default !== undefined).map((f) => [f.name, exampleValue(f)]),
  );
}

// Indent every line after the first, so a JSON block can be spliced into a template at the right depth.
function indentBlock(json: string, spaces: number): string {
  return json
    .split("\n")
    .map((line, i) => (i === 0 ? line : " ".repeat(spaces) + line))
    .join("\n");
}

function toPythonLiteral(value: unknown, spaces: number): string {
  const json = JSON.stringify(value, null, 4).replace(/: true\b/g, ": True").replace(/: false\b/g, ": False").replace(/: null\b/g, ": None");
  return indentBlock(json, spaces);
}

function toJsonLiteral(value: unknown, spaces: number): string {
  return indentBlock(JSON.stringify(value, null, 2), spaces);
}

export function pythonSample(toolName: string, apiUrl: string, input: Record<string, unknown>): string {
  const body = toPythonLiteral({ input }, 0);
  return `import requests
import time
import json

api_key = "YOUR_API_KEY"
base_url = "${apiUrl}/api/v1"

# Start the run
response = requests.post(
    f"{base_url}/tools/${toolName}/runs",
    json=${indentBlock(body, 4)},
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    },
)
result = response.json()
run_id = result["runId"]
print(f"Started run: {run_id}")

# Poll until the run reaches a terminal status
while True:
    poll = requests.get(
        f"{base_url}/tool-runs/{run_id}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    status = poll.json()

    if status["status"] == "succeeded":
        print(json.dumps(status["output"], indent=2))
        break
    elif status["status"] == "failed":
        print(f"Failed: {status.get('error', 'Unknown error')}")
        break
    elif status["status"] == "cancelled":
        print("Cancelled: the run stopped before it completed")
        break

    time.sleep(5)
`;
}

export function curlSample(toolName: string, apiUrl: string, input: Record<string, unknown>): string {
  const body = toJsonLiteral({ input }, 2);
  return `# Start the run
curl -X POST '${apiUrl}/api/v1/tools/${toolName}/runs' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -d '${body}'

# Poll for result (replace RUN_ID with the runId from above)
curl '${apiUrl}/api/v1/tool-runs/RUN_ID' \\
  -H 'Authorization: Bearer YOUR_API_KEY'
`;
}

export function javascriptSample(toolName: string, apiUrl: string, input: Record<string, unknown>): string {
  const body = toJsonLiteral({ input }, 2);
  return `const apiKey = "YOUR_API_KEY";
const baseUrl = "${apiUrl}/api/v1";

// Start the run
const response = await fetch(\`\${baseUrl}/tools/${toolName}/runs\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${apiKey}\`,
  },
  body: JSON.stringify(${body}),
});
const { runId } = await response.json();
console.log("Started run:", runId);

// Poll until the run reaches a terminal status
async function pollForResult(runId) {
  while (true) {
    const res = await fetch(\`\${baseUrl}/tool-runs/\${runId}\`, {
      headers: { Authorization: \`Bearer \${apiKey}\` },
    });
    const status = await res.json();

    if (status.status === "succeeded") {
      return status.output;
    } else if (status.status === "failed") {
      throw new Error(status.error?.message ?? "Unknown error");
    } else if (status.status === "cancelled") {
      throw new Error("Cancelled: the run stopped before it completed");
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}

const output = await pollForResult(runId);
`;
}

export function sampleCode(language: ApiLanguage, toolName: string, apiUrl: string, input: Record<string, unknown>): string {
  if (language === "cURL") return curlSample(toolName, apiUrl, input);
  if (language === "JavaScript") return javascriptSample(toolName, apiUrl, input);
  return pythonSample(toolName, apiUrl, input);
}
