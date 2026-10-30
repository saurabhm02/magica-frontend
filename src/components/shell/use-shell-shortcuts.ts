"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUiStore } from "@/stores/ui.store";

export function useShellShortcuts() {
  const router = useRouter();
  const toggleSidebarCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/tasks?focus=1");
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebarCollapsed();
      } else if (e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        router.push("/");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, toggleSidebarCollapsed]);
}
