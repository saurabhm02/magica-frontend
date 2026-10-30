"use client";

import { ArrowUp, ChevronDown, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSchemaFields, type SchemaField as SchemaFieldType } from "@/lib/json-schema";
import { EstimateBadge } from "./estimate-badge";
import { SchemaField, type FieldValue } from "./schema-field";
import { SelectInput } from "./select-input";

export type GptImage2SubModel = { value: "text" | "edit"; onChange: (value: "text" | "edit") => void };

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

// A field without a default isn't ready to show by default unless it's required:
// that's exactly the set Magica tucks under "Advanced Settings".
function isAdvanced(field: SchemaFieldType): boolean {
  return !field.required && field.default === undefined;
}

export function InputCard({
  schema,
  estimatedCredits,
  isGenerating,
  onGenerate,
  onNewRun,
  subModel,
}: {
  schema: Record<string, unknown>;
  estimatedCredits: number;
  isGenerating: boolean;
  onGenerate: (input: Record<string, unknown>) => void;
  onNewRun: () => void;
  // GPT Image 2 only: its "Text to Image" / "Image to Image" select above Prompt, which maps
  // to the `mode` field and controls whether `uploadedImages` shows at all.
  subModel?: GptImage2SubModel;
}) {
  const allFields = getSchemaFields(schema);
  const fields = subModel ? allFields.filter((f) => f.name !== "mode") : allFields;
  const isPromoted = (f: SchemaFieldType) => !!subModel && f.name === "uploadedImages";

  let visibleFields = fields.filter((f) => !isAdvanced(f) || isPromoted(f));
  const advancedFields = fields.filter((f) => isAdvanced(f) && !isPromoted(f));

  if (subModel) {
    const showImages = subModel.value === "edit";
    const images = visibleFields.find(isPromoted);
    const rest = visibleFields.filter((f) => !isPromoted(f));
    visibleFields = showImages && images ? [images, ...rest] : rest;
  }

  const [values, setValues] = useState<FormValues>(() => initialValues(allFields));
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isUploading = uploadingFields.size > 0;

  const handleReset = () => setValues(initialValues(allFields));
  const handleGenerate = () => {
    const input: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) continue;
      if (subModel && key === "uploadedImages" && subModel.value !== "edit") continue;
      input[key] = value;
    }
    if (subModel) input.mode = subModel.value;
    onGenerate(input);
  };

  const disabled = !isValid(fields, values) || isGenerating || isUploading;
  const buttonLabel = isUploading ? "Uploading..." : isGenerating ? "Generating..." : "Generate";
  const ButtonIcon = isUploading ? ArrowUp : isGenerating ? Loader2 : Sparkles;

  const renderField = (field: SchemaFieldType) => (
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
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-12 border border-border-tertiary bg-surface-main-background shadow-sm lg:h-[600px]">
      <div className="flex items-center justify-between gap-3 border-b border-border-tertiary px-4 py-4">
        <div>
          <h2 className="text-lg leading-7 font-semibold text-text-primary">Input</h2>
          <p className="text-sm text-text-secondary">Configure model parameters</p>
        </div>
        <EstimateBadge credits={estimatedCredits} />
      </div>

      {/* Like Magica, the inputs are locked and dimmed while a run is going; "New Run" stays usable. */}
      <fieldset
        disabled={isGenerating}
        className={`min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 transition-opacity ${isGenerating ? "opacity-50" : ""}`}
      >
        {subModel && (
          <SelectInput
            ariaLabel="Sub-model"
            value={subModel.value}
            onChange={(v) => subModel.onChange(v as "text" | "edit")}
            options={[
              { value: "text", label: "Text to Image" },
              { value: "edit", label: "Image to Image" },
            ]}
          />
        )}

        {visibleFields.map(renderField)}

        {advancedFields.length > 0 && (
          <div>
            <button
              type="button"
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Advanced Settings ({advancedFields.length})
              <ChevronDown className={`size-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </button>
            {advancedOpen && <div className="mt-4 space-y-4">{advancedFields.map(renderField)}</div>}
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-2 border-t border-border-tertiary bg-surface-secondary/30 px-4 py-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            className={cn(
              "h-12 flex-1 rounded-full border border-border-tertiary bg-surface-primary text-sm font-semibold",
              isGenerating && "opacity-60",
            )}
          >
            <RotateCcw />
            Reset
          </Button>
          <Button type="button" disabled={disabled} onClick={handleGenerate} className="h-12 flex-1 rounded-full bg-action text-sm font-semibold text-white hover:bg-action hover:opacity-90">
            <ButtonIcon className={isGenerating ? "animate-spin" : undefined} />
            {buttonLabel}
          </Button>
        </div>
        {isGenerating && (
          <Button type="button" variant="secondary" onClick={onNewRun} className="h-10 w-full rounded-12 border border-border-tertiary bg-surface-primary text-sm font-semibold">
            New Run
          </Button>
        )}
      </div>
    </div>
  );
}
