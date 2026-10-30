"use client";

import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSchemaFields, type SchemaField as SchemaFieldType } from "@/lib/json-schema";
import { EstimateBadge } from "./estimate-badge";
import { SchemaField, type FieldValue } from "./schema-field";

type FormValues = Record<string, FieldValue>;

function initialValues(fields: SchemaFieldType[]): FormValues {
  return Object.fromEntries(fields.map((f) => [f.name, f.default as FieldValue]));
}

function isValid(fields: SchemaFieldType[], values: FormValues): boolean {
  return fields.every((f) => {
    if (!f.required) return true;
    const value = values[f.name];
    return value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);
  });
}

export function InputCard({
  schema,
  estimatedCredits,
  isGenerating,
  onGenerate,
}: {
  schema: Record<string, unknown>;
  estimatedCredits: number;
  isGenerating: boolean;
  onGenerate: (input: Record<string, unknown>) => void;
}) {
  const fields = getSchemaFields(schema);
  const [values, setValues] = useState<FormValues>(() => initialValues(fields));
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());

  const isUploading = uploadingFields.size > 0;

  const handleReset = () => setValues(initialValues(fields));
  const handleGenerate = () => {
    const input = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined));
    onGenerate(input);
  };

  const disabled = !isValid(fields, values) || isGenerating || isUploading;
  const buttonLabel = isUploading ? "Uploading..." : isGenerating ? "Generating…" : "Generate";
  const ButtonIcon = isUploading ? ArrowUp : Sparkles;

  return (
    <div className="flex flex-1 flex-col rounded-16 border border-border-secondary bg-surface-primary">
      <div className="flex items-center justify-between gap-3 border-b border-border-secondary p-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Input</h2>
          <p className="text-xs text-text-secondary">Configure model parameters</p>
        </div>
        <EstimateBadge credits={estimatedCredits} />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4">
        {fields.map((field) => (
          <SchemaField
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
            onUploadingChange={(uploading) =>
              setUploadingFields((prev) => {
                const next = new Set(prev);
                if (uploading) next.add(field.name);
                else next.delete(field.name);
                return next;
              })
            }
          />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border-secondary p-4">
        <Button type="button" variant="secondary" onClick={handleReset}>
          <RotateCcw />
          Reset
        </Button>
        <Button type="button" disabled={disabled} onClick={handleGenerate}>
          <ButtonIcon />
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
