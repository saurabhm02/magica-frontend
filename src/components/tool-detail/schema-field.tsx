"use client";

import { UploadCloud, X } from "lucide-react";
import type { SchemaField as SchemaFieldType } from "@/lib/json-schema";

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
}: {
  field: SchemaFieldType;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
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
    const urls = (value as string[] | undefined) ?? (field.multiple ? [] : [""]);
    const isVideo = field.name.toLowerCase().includes("video");
    const atMax = field.multiple && field.maxItems !== undefined && urls.length >= field.maxItems;

    return (
      <div>
        <FieldLabel field={field} />
        <button
          type="button"
          disabled
          title="Paste a URL for now"
          className="flex w-full items-center justify-center gap-2 rounded-10 border border-dashed border-border-secondary px-3 py-2.5 text-sm text-text-tertiary disabled:opacity-60"
        >
          <UploadCloud className="size-4" />
          Upload {isVideo ? "Video" : "Image"}
        </button>

        <div className="mt-2 flex flex-col gap-2">
          {urls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={url}
                onChange={(e) => {
                  const next = [...urls];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                placeholder="Paste a URL for now"
                className={inputClassName}
              />
              {field.multiple && (
                <button
                  type="button"
                  aria-label="Remove URL"
                  onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                  className="shrink-0 text-text-tertiary hover:text-text-primary"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {field.multiple && (
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              disabled={atMax}
              onClick={() => onChange([...urls, ""])}
              className="text-xs text-text-secondary hover:text-text-primary disabled:opacity-40"
            >
              + Add URL
            </button>
            <p className="text-xs text-text-tertiary">
              {urls.filter(Boolean).length}/{field.maxItems ?? "∞"} uploaded
            </p>
          </div>
        )}
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
