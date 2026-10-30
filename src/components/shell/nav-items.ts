import {
  Boxes,
  CalendarClock,
  CirclePlus,
  FolderOpen,
  LifeBuoy,
  type LucideIcon,
  MessageSquareMore,
  Sparkles,
} from "lucide-react";
import { ApiBook } from "@/components/icons/api-book";
import { Books } from "@/components/icons/books";

export type NavItem = {
  label: string;
  icon: LucideIcon | typeof Books;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  shortcut?: string;
  skipActive?: boolean;
};

export const navItems: NavItem[] = [
  { label: "New task", icon: CirclePlus, href: "/", shortcut: "⇧⌘O", skipActive: true },
  { label: "Tasks", icon: MessageSquareMore, href: "/tasks" },
  { label: "Projects", icon: FolderOpen, disabled: true },
  { label: "Scheduled", icon: CalendarClock, disabled: true },
  { label: "Library", icon: Books, href: "/library" },
  { label: "Tools", icon: Boxes, href: "/tools" },
  { label: "API / MCP", icon: ApiBook, href: process.env.NEXT_PUBLIC_DOCS_URL, external: true },
  { label: "Help & Support", icon: LifeBuoy, disabled: true },
  { label: "Unfair Advantage", icon: Sparkles, disabled: true },
];
