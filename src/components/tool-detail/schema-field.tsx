"use client";

import type { SchemaField as SchemaFieldType } from "@/lib/json-schema";
import { cn } from "@/lib/utils";
import { SelectInput } from "./select-input";
import { UploadField } from "./upload-field";

export type FieldValue = string | number | boolean | string[] | undefined;

function FieldLabel({ field }: { field: SchemaFieldType }) {
  return (
    <div className="mb-1.5 flex flex-col gap-0.5">
      <label className="text-base font-medium text-text-primary">
        {field.label}
        {field.required && <span className="ml-0.5 text-error">*</span>}
      </label>
      {field.description && <p className="text-[13px] leading-[18px] text-text-secondary">{field.description}</p>}
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
        <SelectInput
          value={value !== undefined ? String(value) : ""}
          onChange={(v) => onChange(field.numeric ? Number(v) : v)}
          options={field.options.map((option) => ({ value: option, label: option }))}
          placeholder="Select…"
        />
      </div>
    );
  }

  if (field.kind === "slider") {
    const current = typeof value === "number" ? value : field.min;
    const percent = field.max === field.min ? 0 : ((current - field.min) / (field.max - field.min)) * 100;
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
            style={{
              background: `linear-gradient(to right, var(--color-text-primary) ${percent}%, var(--color-surface-tertiary) ${percent}%)`,
            }}
            className={cn(
              "h-1 flex-1 cursor-pointer appearance-none rounded-full",
              "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent",
              "[&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-surface-primary [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110",
              "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent",
              "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-surface-primary [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:transition-transform hover:[&::-moz-range-thumb]:scale-110",
            )}
          />
          <span className="w-14 shrink-0 text-right text-sm text-text-secondary tabular-nums">
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
          placeholder="Enter Prompt..."
          maxLength={field.maxLength}
          className={`${inputClassName} h-[86px] resize-y`}
        />
        {field.maxLength && (
          <p className="mt-1 text-right text-xs text-text-secondary">
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
        <span className="text-base font-medium text-text-primary">
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
