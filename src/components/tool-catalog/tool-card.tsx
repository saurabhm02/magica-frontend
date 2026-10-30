import Link from "next/link";
import type { ToolItem } from "@/contracts/api";
import { ToolIcon } from "@/components/icons/tool-icon";
import { formatCredits } from "@/lib/constants";

export function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <Link
      href={`/tools/${tool.name}`}
      className="flex h-[94px] w-full flex-col rounded-20 bg-surface-primary p-0.5 shadow-[0_0_0_1px_var(--color-border-tertiary),0_1px_2px_0_rgb(0_0_0/0.05)] transition hover:bg-surface-hover hover:shadow-[0_0_0_1px_var(--color-border-secondary),0_4px_8px_0_rgb(0_0_0/0.08)] active:bg-surface-tertiary active:shadow-[inset_0_1px_2px_0_rgb(0_0_0/0.15)]"
    >
      <div className="flex h-[46px] shrink-0 items-center">
        <span className="ml-[18px] flex size-[18px] shrink-0 items-center justify-center text-text-primary">
          <ToolIcon name={tool.name} category={tool.category} />
        </span>
        <span className="ml-3 truncate text-sm font-normal text-text-primary">{tool.displayName}</span>
      </div>
      <div className="flex h-11 items-center justify-between gap-3 rounded-[18px] bg-surface-tertiary px-[18px] text-[13px] leading-[19.5px] text-text-secondary">
        <p className="truncate">{tool.description}</p>
        <strong className="shrink-0 font-medium">~ {formatCredits(tool.estimatedCredits)}</strong>
      </div>
    </Link>
  );
}
