import { create } from "zustand";
import type { ArtifactAsset, ArtifactPanelState, StepItem } from "@/lib/types";

type UiState = {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  artifactPanel: ArtifactPanelState | null;
  toggleSidebarCollapsed: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  openStepArtifact: (step: StepItem, asset?: ArtifactAsset) => void;
  openMediaArtifact: (asset: ArtifactAsset) => void;
  closeArtifact: () => void;
  reset: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  artifactPanel: null,
  toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
  openStepArtifact: (step, asset) => set({ artifactPanel: { step, asset } }),
  openMediaArtifact: (asset) => set({ artifactPanel: { asset } }),
  closeArtifact: () => set({ artifactPanel: null }),
  reset: () => set({ sidebarCollapsed: false, mobileDrawerOpen: false, artifactPanel: null }),
}));
