import type { StepItem } from "./types";

export const REASONING_RENDER_KEY = "reasoning";

export function isReasoningStep(step: StepItem): boolean {
  return step.renderKey === REASONING_RENDER_KEY;
}

// Free models often open with "Here's a thinking process:" and use markdown bold.
// Magica shows plain thinking, so drop both.
export function cleanReasoning(text: string): string {
  return text
    .replace(/^\s*(here'?s|here is)?\s*(a|my)?\s*thinking process:?\s*/i, "")
    .replace(/\*\*/g, "")
    .trim();
}

// The live reasoning stream holds every step's thinking back to back. Reasoning rows already
// hold the earlier parts, so what is left is the thinking happening right now.
export function thinkingInProgress(reasoning: string | undefined, steps: StepItem[]): string {
  const shownLength = steps.filter(isReasoningStep).reduce((total, s) => total + (s.text?.length ?? 0), 0);
  const rest = (reasoning ?? "").slice(shownLength);
  return rest.trim() ? rest : "";
}
