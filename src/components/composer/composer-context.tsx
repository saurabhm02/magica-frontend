"use client";

import { createContext, use } from "react";

type ComposerContextValue = {
  value: string;
  setValue: (value: string) => void;
  planMode: boolean;
  togglePlanMode: () => void;
  disabled: boolean;
  error: string | null;
  submit: () => void;
};

export const ComposerContext = createContext<ComposerContextValue | null>(null);

export function useComposer() {
  const context = use(ComposerContext);
  if (!context) throw new Error("Composer subcomponents must be used inside <Composer.Provider>");
  return context;
}
