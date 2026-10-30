"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-items";

// Same look as Magica's sidebar rows (measured on magica.com): 34px tall, radius 10,
// grey text; hover lightens the background, the active row gets a 1px inner border.
export const sidebarRowClassName =
  "group flex h-[34px] w-full items-center gap-[9px] rounded-10 px-2 text-sm font-medium text-text-secondary transition-colors duration-75 hover:bg-surface-secondary hover:text-text-primary active:bg-surface-tertiary";
export const sidebarRowActiveClassName =
  "bg-surface-tertiary text-text-primary shadow-[inset_0_0_0_1px_var(--color-border-secondary)] hover:bg-surface-tertiary";

export function SidebarNavItem({ label, icon: Icon, href, external, disabled, shortcut, skipActive }: NavItem) {
  const pathname = usePathname();
  const isActive = !skipActive && !!href && pathname === href;

  // Not-built items keep the exact look of a normal row, they just do nothing.
  if (disabled) {
    return (
      <button type="button" aria-disabled="true" title={NOT_AVAILABLE_TOOLTIP} className={sidebarRowClassName}>
        <Icon className="size-4 shrink-0" />
        {label}
      </button>
    );
  }

  return (
    <Link
      href={href ?? "#"}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(sidebarRowClassName, isActive && sidebarRowActiveClassName)}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      {shortcut && (
        <span
          aria-hidden="true"
          className="ml-auto shrink-0 text-xs text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
        >
          {shortcut}
        </span>
      )}
    </Link>
  );
}
