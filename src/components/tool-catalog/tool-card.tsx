import { Image, Video, Wrench, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ToolCategory, ToolItem } from "@/contracts/api";
import { formatCredits } from "@/lib/constants";

const CATEGORY_ICON: Record<ToolCategory, LucideIcon> = {
  image: Image,
  video: Video,
  util: Wrench,
};

export function ToolCard({ tool }: { tool: ToolItem }) {
  const Icon = CATEGORY_ICON[tool.category];

  return (
    <Link
      href={`/tools/${tool.name}`}
      className="flex flex-col overflow-hidden rounded-16 border border-border-secondary bg-surface-primary transition hover:border-text-secondary"
    >
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-10 bg-surface-tertiary text-text-secondary">
          <Icon className="size-3.5" />
        </span>
        <span className="truncate text-sm font-semibold text-text-primary">{tool.displayName}</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border-secondary bg-surface-secondary px-4 py-3">
        <p className="truncate text-xs text-text-secondary">{tool.description}</p>
        <span className="shrink-0 text-xs text-text-tertiary">~ {formatCredits(tool.estimatedCredits)}</span>
      </div>
    </Link>
  );
}
