// Parses the JSON Schema a tool's GET /tools/:name returns (via z.toJSONSchema on
// the server) into a flat list of form fields. Kept generic on purpose: nothing here
// is specific to a tool name, only to the JSON Schema shape of its `inputs`.

export type JsonSchemaProperty = {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  items?: JsonSchemaProperty;
};

export type ObjectJsonSchema = {
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

type FieldKind =
  | { kind: "select"; options: string[] }
  | { kind: "slider"; min: number; max: number; integer: boolean }
  | { kind: "textarea"; maxLength?: number }
  | { kind: "text" }
  | { kind: "url"; multiple: boolean; minItems?: number; maxItems?: number }
  | { kind: "boolean" };

export type SchemaField = {
  name: string;
  label: string;
  description?: string;
  required: boolean;
  default?: unknown;
} & FieldKind;

const LONG_TEXT_THRESHOLD = 200;
// z.toJSONSchema has no "unbounded" marker, so an int max this large just means "no real limit".
const UNBOUNDED_INT_MAX = Number.MAX_SAFE_INTEGER;

function humanize(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fieldKind(prop: JsonSchemaProperty): FieldKind {
  if (prop.enum) return { kind: "select", options: prop.enum };

  const isUriString = (p?: JsonSchemaProperty) => p?.type === "string" && p.format === "uri";
  if (prop.type === "array" && isUriString(prop.items)) {
    return { kind: "url", multiple: true, minItems: prop.minItems, maxItems: prop.maxItems };
  }
  if (isUriString(prop)) return { kind: "url", multiple: false };

  if (prop.type === "number" || prop.type === "integer") {
    const hasRealMax = prop.maximum !== undefined && prop.maximum !== UNBOUNDED_INT_MAX;
    const min = prop.minimum ?? prop.exclusiveMinimum;
    if (min !== undefined && hasRealMax) {
      return { kind: "slider", min, max: prop.maximum as number, integer: prop.type === "integer" };
    }
    return { kind: "text" };
  }

  if (prop.type === "boolean") return { kind: "boolean" };

  if (prop.type === "string") {
    return (prop.maxLength ?? 0) > LONG_TEXT_THRESHOLD ? { kind: "textarea", maxLength: prop.maxLength } : { kind: "text" };
  }

  return { kind: "text" };
}

export function getSchemaFields(schema: ObjectJsonSchema): SchemaField[] {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);

  return Object.entries(properties)
    .filter(([, prop]) => prop.type !== "object")
    .map(([name, prop]) => ({
      name,
      label: prop.title ?? humanize(name),
      description: prop.description,
      // A field with a schema default doesn't need the user to fill it in, even if
      // Zod's JSON Schema output still lists it as "required".
      required: required.has(name) && prop.default === undefined,
      default: prop.default,
      ...fieldKind(prop),
    }));
}
