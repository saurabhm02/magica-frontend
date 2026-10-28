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
  { label: "Tasks", icon: MessagesSquare },
  { label: "Projects", icon: FolderOpen, disabled: true },
  { label: "Scheduled", icon: CalendarClock, disabled: true },
  { label: "Library", icon: LibraryBig, disabled: true },
  { label: "Tools", icon: Blocks, disabled: true },
  { label: "API / MCP", icon: Plug, disabled: true },
  { label: "Help & Support", icon: CircleHelp, disabled: true },
  { label: "Unfair Advantage", icon: Sparkles, disabled: true },
];
