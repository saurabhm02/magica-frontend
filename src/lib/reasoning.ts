import type { StepItem } from "./types";

export const REASONING_RENDER_KEY = "reasoning";

export function isReasoningStep(step: StepItem): boolean {
  return step.renderKey === REASONING_RENDER_KEY;
}

/**
 * Tidies the model's thinking text for display.
 * Free models often open with "Here's a thinking process:" and use markdown bold.
 * Magica shows plain thinking, so drop both.
 *
 * Input:
 * - text: raw reasoning text
 *
 * Output:
 * - The text without that opening phrase or ** markers, trimmed.
 */
export function cleanReasoning(text: string): string {
  return text
    .replace(/^\s*(here'?s|here is)?\s*(a|my)?\s*thinking process:?\s*/i, "")
    .replace(/\*\*/g, "")
    .trim();
}

/**
 * Finds the part of the live reasoning that is not shown in a reasoning row yet.
 * The live reasoning stream holds every step's thinking back to back. Reasoning rows already
 * hold the earlier parts, so what is left is the thinking happening right now.
 *
 * Input:
 * - reasoning: the full live reasoning stream
 * - steps: the run's steps, including reasoning rows
 *
 * Output:
 * - The remaining text, or "" if only whitespace is left.
 */
export function thinkingInProgress(reasoning: string | undefined, steps: StepItem[]): string {
  const shownLength = steps.filter(isReasoningStep).reduce((total, s) => total + (s.text?.length ?? 0), 0);
  const rest = (reasoning ?? "").slice(shownLength);
  return rest.trim() ? rest : "";
}
