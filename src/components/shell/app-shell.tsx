"use client";

import { ArtifactPanel } from "@/components/artifacts/artifact-panel";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { useShellShortcuts } from "./use-shell-shortcuts";

export function AppShell({ children }: { children: React.ReactNode }) {
  useShellShortcuts();

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-main-background md:gap-2 md:p-2">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-main-background md:rounded-24">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <ArtifactPanel />
    </div>
  );
}
