"use client";

import type { SchemaField as SchemaFieldType } from "@/lib/json-schema";
import { UploadField } from "./upload-field";

export type FieldValue = string | number | boolean | string[] | undefined;

function FieldLabel({ field }: { field: SchemaFieldType }) {
  return (
    <div className="mb-1.5">
      <label className="text-sm font-semibold text-text-primary">
        {field.label}
        {field.required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {field.description && <p className="text-xs text-text-secondary">{field.description}</p>}
    </div>
  );
}

const inputClassName =
  "w-full rounded-10 border border-border-secondary bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none";

export function SchemaField({
  field,
  value,
  onChange,
  onUploadingChange,
}: {
  field: SchemaFieldType;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  if (field.kind === "select") {
    return (
      <div>
        <FieldLabel field={field} />
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        >
          <option value="" disabled>
            Select…
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === "slider") {
    const current = typeof value === "number" ? value : field.min;
    return (
      <div>
        <FieldLabel field={field} />
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.integer ? 1 : 0.1}
            value={current}
            onChange={(e) => onChange(field.integer ? parseInt(e.target.value, 10) : parseFloat(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-tertiary accent-text-primary"
          />
          <span className="w-10 shrink-0 text-right text-sm text-text-secondary">
            {typeof value === "number" ? value : ""}
          </span>
        </div>
      </div>
    );
  }

  if (field.kind === "textarea") {
    const text = (value as string) ?? "";
    return (
      <div>
        <FieldLabel field={field} />
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter Prompt…"
          maxLength={field.maxLength}
          rows={4}
          className={`${inputClassName} resize-none`}
        />
        {field.maxLength && (
          <p className="mt-1 text-right text-xs text-text-tertiary">
            {text.length}/{field.maxLength}
          </p>
        )}
      </div>
    );
  }

  if (field.kind === "boolean") {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded accent-text-primary"
        />
        <span className="text-sm font-semibold text-text-primary">
          {field.label}
          {field.required && <span className="ml-0.5 text-error">*</span>}
        </span>
      </label>
    );
  }

  if (field.kind === "url") {
    const isVideo = field.name.toLowerCase().includes("video");

    return (
      <div>
        <FieldLabel field={field} />
        <UploadField
          scopeId={`tool-input-${field.name}`}
          accept={isVideo ? "video" : "image"}
          multiple={field.multiple}
          maxFiles={field.maxItems}
          onChange={(urls) => onChange(field.multiple ? urls : urls[0])}
          onUploadingChange={onUploadingChange ?? (() => {})}
        />
      </div>
    );
  }

  return (
    <div>
      <FieldLabel field={field} />
      <input
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
      />
    </div>
  );
}
