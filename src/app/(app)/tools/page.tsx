"use client";

import { useMemo, useState } from "react";
import { CategoryChips, type CategoryFilter } from "@/components/tool-catalog/category-chips";
import { ToolCard } from "@/components/tool-catalog/tool-card";
import { SearchInput } from "@/components/ui/search-input";
import { useTools } from "@/queries/tools";

export default function ToolsPage() {
  const { data, isPending, isError } = useTools();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const enabledCategories = useMemo(
    () => new Set((data ?? []).map((tool) => tool.category) as CategoryFilter[]),
    [data],
  );

  const tools = (data ?? []).filter((tool) => {
    const matchesCategory = category === "all" || tool.category === category;
    const matchesQuery = tool.displayName.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <h1 className="text-2xl font-bold text-text-primary">Tools</h1>
      <p className="mt-1 text-sm text-text-secondary">Explore tools for video, image, audio, LLMs, and more.</p>

      <div className="mt-6 flex flex-col gap-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Search tools" />
        <CategoryChips value={category} onChange={setCategory} enabled={enabledCategories} />
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
