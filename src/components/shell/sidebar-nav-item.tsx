import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-items";

export function SidebarNavItem({ label, icon: Icon, href, disabled }: NavItem) {
  const className = cn(
    "flex h-[34px] items-center gap-2 rounded-10 px-2 text-sm text-text-primary transition-colors",
    disabled ? "text-text-tertiary" : "hover:bg-surface-hover",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon className="size-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" aria-disabled={disabled} className={className}>
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );
}
