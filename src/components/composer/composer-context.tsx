"use client";

import { createContext, use } from "react";
import type { AssetItem } from "@/contracts/api";
import type { AttachmentItem } from "@/lib/types";

type ComposerContextValue = {
  value: string;
  setValue: (value: string) => void;
  planMode: boolean;
  togglePlanMode: () => void;
  disabled: boolean;
  error: string | null;
  submit: () => void;
  stop: () => void;
  attachments: AttachmentItem[];
  addFiles: (files: File[]) => void;
  addFromLibrary: (asset: AssetItem) => void;
  removeAttachment: (id: string) => void;
  retryAttachment: (id: string) => void;
};

export const ComposerContext = createContext<ComposerContextValue | null>(null);

export function useComposer() {
  const context = use(ComposerContext);
  if (!context) throw new Error("Composer subcomponents must be used inside <Composer.Provider>");
  return context;
}
