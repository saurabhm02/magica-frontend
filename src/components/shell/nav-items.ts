import {
  Blocks,
  CalendarClock,
  CircleHelp,
  FolderOpen,
  LibraryBig,
  type LucideIcon,
  MessagesSquare,
  Plug,
  Plus,
  Sparkles,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  disabled?: boolean;
};

export const navItems: NavItem[] = [
  { label: "New task", icon: Plus, href: "/" },
  { label: "Tasks", icon: MessagesSquare, href: "/tasks" },
  { label: "Projects", icon: FolderOpen, disabled: true },
  { label: "Scheduled", icon: CalendarClock, disabled: true },
  { label: "Library", icon: LibraryBig, href: "/library" },
  { label: "Tools", icon: Blocks, href: "/tools" },
  { label: "API / MCP", icon: Plug, disabled: true },
  { label: "Help & Support", icon: CircleHelp, disabled: true },
  { label: "Unfair Advantage", icon: Sparkles, disabled: true },
];
