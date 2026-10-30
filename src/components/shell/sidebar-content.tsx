"use client";

import { ChevronRight, ChevronUp, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutSidebar } from "@/components/icons/layout-sidebar";
import { IconButton } from "@/components/ui/icon-button";
import { ChatList } from "./chat-list";
import { navItems } from "./nav-items";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarNavItem } from "./sidebar-nav-item";

const headerButtonClassName = "text-text-primary hover:bg-surface-hover";

export function SidebarContent({ onCollapse }: { onCollapse?: () => void }) {
  const router = useRouter();
  const [recentOpen, setRecentOpen] = useState(true);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[52px] items-start justify-between pt-2.5 pr-2 pb-0 pl-3">
        <button
          type="button"
          aria-label="Start a new task"
          onClick={() => router.push("/")}
          className="flex h-8 items-center rounded-10 px-1 text-base font-semibold text-text-primary"
        >
          Magica
        </button>
        <div className="flex items-center gap-0.5">
          <IconButton
            size="sm"
            aria-label="Search"
            title="Search ⌘K"
            onClick={() => router.push("/tasks?focus=1")}
            className={headerButtonClassName}
          >
            <Search />
          </IconButton>
          {onCollapse && (
            <IconButton
              size="sm"
              aria-label="Collapse sidebar"
              title="Toggle sidebar ⌘B"
              onClick={onCollapse}
              className={headerButtonClassName}
            >
              <LayoutSidebar />
            </IconButton>
          )}
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-2 pb-3">
        {navItems.map((item) => (
          <SidebarNavItem key={item.label} {...item} />
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="group/history mx-2 flex min-h-8 items-center rounded-10 px-2 py-1 text-xs leading-4 transition-colors duration-75 hover:bg-surface-secondary">
          <button
            type="button"
            aria-expanded={recentOpen}
            onClick={() => setRecentOpen((v) => !v)}
            className="flex min-w-0 items-center gap-1 text-text-secondary transition-colors hover:text-text-primary"
          >
            <span className="truncate">Recent tasks</span>
            <ChevronUp
              strokeWidth={1.75}
              className={`size-3 shrink-0 opacity-0 transition-[transform,opacity] group-hover/history:opacity-100 ${recentOpen ? "" : "rotate-180"}`}
            />
          </button>
          <a
            href="/tasks"
            onClick={(e) => {
              e.preventDefault();
              router.push("/tasks");
            }}
            className="ml-auto flex items-center gap-1 text-[10px] leading-3 text-text-secondary opacity-0 transition-[color,opacity] hover:text-text-primary group-hover/history:opacity-100"
          >
            View all
            <ChevronRight strokeWidth={1.75} className="size-3" />
          </a>
        </div>
        <ChatList collapsed={!recentOpen} />
      </div>

      <SidebarFooter />
    </div>
  );
}
