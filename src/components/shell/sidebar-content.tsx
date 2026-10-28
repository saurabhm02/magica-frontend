import { PanelLeftClose, Search } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ChatList } from "./chat-list";
import { navItems } from "./nav-items";
import { SidebarNavItem } from "./sidebar-nav-item";
import { UserCard } from "./user-card";

export function SidebarContent({ onCollapse }: { onCollapse?: () => void }) {
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

      <ChatList />

      <div className="border-t border-border-tertiary px-3 py-2">
        <UserCard />
      </div>
    </div>
  );
}
