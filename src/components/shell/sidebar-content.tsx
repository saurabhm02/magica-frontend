"use client";

import { PanelLeftClose, Search } from "lucide-react";
import { formatCredits } from "@/lib/constants";
import { useCredits } from "@/queries/credits";
import { CreditsSparkles } from "@/components/icons/credits-sparkles";
import { IconButton } from "@/components/ui/icon-button";
import { ChatList } from "./chat-list";
import { navItems } from "./nav-items";
import { SidebarNavItem } from "./sidebar-nav-item";
import { UserCard } from "./user-card";

export function SidebarContent({ onCollapse }: { onCollapse?: () => void }) {
  const { data: credits } = useCredits();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[52px] items-start justify-between pt-2.5 pr-2 pb-0 pl-3">
        <span className="pt-0.5 text-base font-semibold text-text-primary">Magica</span>
        <div className="flex items-center gap-1">
          <IconButton size="sm" aria-label="Search">
            <Search />
          </IconButton>
          {onCollapse && (
            <IconButton size="sm" aria-label="Collapse sidebar" onClick={onCollapse}>
              <PanelLeftClose />
            </IconButton>
          )}
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 pb-3">
        {navItems.map((item) => (
          <SidebarNavItem key={item.label} {...item} />
        ))}
      </nav>

      <p className="px-3 pb-1 text-xs text-text-tertiary">Recent tasks</p>
      <ChatList />

      <div className="border-t border-border-tertiary px-3 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <CreditsSparkles className="size-4" />
            Available Credits
          </span>
          <span className="text-text-primary font-medium">
            {credits ? formatCredits(credits.balance) : "—"}
          </span>
        </div>
        <UserCard />
      </div>
    </div>
  );
}
