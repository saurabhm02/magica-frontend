import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";
import { navItems } from "./nav-items";

export function SidebarRail({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex h-full flex-col items-center gap-1 py-2.5">
      <IconButton size="sm" aria-label="Expand sidebar" title="Toggle sidebar ⌘B" onClick={onExpand}>
        <PanelLeft />
      </IconButton>

      <nav className="flex flex-col items-center gap-1 pt-2">
        {navItems.map(({ label, icon: Icon, href, external, disabled }) => {
          const className = cn(
            "flex size-[34px] items-center justify-center rounded-10 text-text-primary transition-colors duration-75",
            "hover:bg-surface-secondary",
          );
          return disabled ? (
            <button key={label} type="button" aria-label={label} aria-disabled="true" title={NOT_AVAILABLE_TOOLTIP} className={className}>
              <Icon className="size-4" />
            </button>
          ) : (
            <Link
              key={label}
              href={href ?? "#"}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={label}
              className={className}
            >
              <Icon className="size-4" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
