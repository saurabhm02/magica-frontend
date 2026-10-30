"use client";

import { Search, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex h-11 items-center gap-2.5 rounded-12 border border-border-secondary bg-surface-primary px-3.5">
      <Search className="size-4 shrink-0 text-text-tertiary" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="shrink-0 text-text-tertiary hover:text-text-primary"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
