"use client";

import { Menu } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui.store";
import { SidebarContent } from "./sidebar-content";

export function MobileSidebar() {
  const open = useUiStore((s) => s.mobileDrawerOpen);
  const setOpen = useUiStore((s) => s.setMobileDrawerOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <IconButton aria-label="Open sidebar" className="md:hidden">
            <Menu />
          </IconButton>
        }
      />
      <SheetContent side="left" className="w-[240px] border-border-tertiary bg-surface-main-background-2 p-0 sm:max-w-[240px]">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
