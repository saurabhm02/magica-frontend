"use client";

import { useUiStore } from "@/stores/ui.store";
import { SidebarContent } from "./sidebar-content";
import { SidebarRail } from "./sidebar-rail";

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);

  return (
    <aside
      className="hidden shrink-0 flex-col overflow-hidden rounded-24 border-r border-sidebar-edge bg-surface-main-background-2 transition-[width] duration-150 md:flex"
      style={{ width: collapsed ? 48 : 240 }}
    >
      {collapsed ? <SidebarRail onExpand={toggleCollapsed} /> : <SidebarContent onCollapse={toggleCollapsed} />}
    </aside>
  );
}
