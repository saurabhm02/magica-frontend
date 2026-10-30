import { z } from "zod";

// The API contract types `questions` as unknown[] (it's generic across waitpoint
// types). This is the actual shape the server sends for type "options".
const QuestionOption = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  recommended: z.boolean().optional(),
});
export type QuestionOption = z.infer<typeof QuestionOption>;

const Question = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["choice", "text"]),
  options: z.array(QuestionOption).optional(),
  placeholder: z.string().optional(),
  allowOther: z.boolean().optional(),
});
export type Question = z.infer<typeof Question>;

export function parseQuestions(questions: unknown): Question[] {
  const parsed = z.array(Question).safeParse(questions);
  return parsed.success ? parsed.data : [];
}

const AnswerItem = z.object({
  questionId: z.string(),
  question: z.string().optional(),
  answer: z.string(),
});
export type AnswerItem = z.infer<typeof AnswerItem>;

export function parseAnswers(answers: unknown): AnswerItem[] {
  const parsed = z.array(AnswerItem).safeParse(answers);
  return parsed.success ? parsed.data : [];
}

// The actual shape of a waitpoint's payload for type "plan" (SubmitPlanInput on the
// server). estimatedCredits is filled in by the server before the waitpoint is created.
const PlanStep = z.object({
  title: z.string(),
  description: z.string(),
  tool: z.string(),
  estimatedCredits: z.number().optional(),
});
export type PlanStep = z.infer<typeof PlanStep>;

const Plan = z.object({
  title: z.string(),
  overview: z.string(),
  steps: z.array(PlanStep),
  totalEstimatedCredits: z.number().optional(),
});
export type Plan = z.infer<typeof Plan>;

export function parsePlan(payload: unknown): Plan | null {
  const parsed = Plan.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

// Shape of the submit_plan tool's saved output (SubmitPlanOutput on the server).
const PlanOutput = z.object({
  action: z.string().optional(),
  feedback: z.string().optional(),
  status: z.string().optional(),
  steps: z.array(PlanStep).optional(),
});
export type PlanOutput = z.infer<typeof PlanOutput>;

export function parsePlanOutput(output: unknown): PlanOutput | null {
  const parsed = PlanOutput.safeParse(output);
  return parsed.success ? parsed.data : null;
}
