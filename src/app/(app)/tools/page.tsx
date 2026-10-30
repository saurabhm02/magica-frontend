"use client";

import { Archive, Search, X } from "lucide-react";
import { useState } from "react";
import { CategoryChips, type CategoryFilter } from "@/components/tool-catalog/category-chips";
import { ToolCard } from "@/components/tool-catalog/tool-card";
import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { useTools } from "@/queries/tools";

export default function ToolsPage() {
  const { data, isPending, isError } = useTools();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const tools = (data ?? []).filter((tool) => {
    const matchesCategory = category === "all" || tool.category === category;
    const matchesQuery = tool.displayName.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <h1 className="text-2xl font-bold text-text-primary">Tools</h1>
      <p className="mt-1 text-sm text-text-secondary">Explore tools for video, image, audio, LLMs, and more.</p>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative w-[550px] max-w-full">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools"
            className="h-11 w-full rounded-full border border-border-secondary bg-surface-primary pr-10 pl-11 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          aria-disabled="true"
          title={NOT_AVAILABLE_TOOLTIP}
          className="flex h-11 shrink-0 cursor-not-allowed items-center gap-2 rounded-full border border-border-secondary px-4 text-sm text-text-secondary"
        >
          <Archive className="size-4" />
          Deprecated models
        </button>
      </div>

      <div className="mt-4">
        <CategoryChips value={category} onChange={setCategory} />
      </div>

      {isPending && <p className="mt-6 text-sm text-text-secondary">Loading…</p>}
      {isError && <p className="mt-6 text-sm text-text-secondary">Couldn&apos;t load tools.</p>}
      {data && tools.length === 0 && <p className="mt-6 text-sm text-text-secondary">No tools found.</p>}

      {tools.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
