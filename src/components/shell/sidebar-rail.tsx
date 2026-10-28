import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";
import { navItems } from "./nav-items";

export function SidebarRail({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex h-full flex-col items-center gap-1 py-2.5">
      <IconButton size="sm" aria-label="Expand sidebar" onClick={onExpand}>
        <PanelLeft />
      </IconButton>

      <nav className="flex flex-col items-center gap-1 pt-2">
        {navItems.map(({ label, icon: Icon, href, disabled }) => {
          const className = cn(
            "flex size-8 items-center justify-center rounded-10 text-text-primary transition-colors",
            disabled ? "text-text-tertiary" : "hover:bg-surface-hover",
          );
          return href ? (
            <Link key={label} href={href} aria-label={label} className={className}>
              <Icon className="size-4" />
            </Link>
          ) : (
            <button key={label} type="button" aria-label={label} aria-disabled={disabled} className={className}>
              <Icon className="size-4" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
