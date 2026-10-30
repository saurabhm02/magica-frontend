"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { RespondWaitpointInput } from "@/contracts/api";
import { useRespondWaitpoint } from "@/queries/messages";
import type { Question } from "@/lib/waitpoint";
import { useLiveRunStore } from "@/stores/live-run.store";
import { WaitpointChoiceQuestion } from "./waitpoint-choice-question";
import { WaitpointTextQuestion } from "./waitpoint-text-question";

export function WaitpointCard({
  chatId,
  waitpointId,
  questions,
  expiresAt,
}: {
  chatId: string;
  waitpointId: string;
  questions: Question[];
  expiresAt?: string;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const clearWaitpoint = useLiveRunStore((s) => s.clearWaitpoint);
  const respond = useRespondWaitpoint(chatId);

  useEffect(() => {
    if (!expiresAt) return;
    const msLeft = new Date(expiresAt).getTime() - Date.now();
    const timer = setTimeout(() => clearWaitpoint(chatId), Math.max(0, msLeft));
    return () => clearTimeout(timer);
  }, [expiresAt, chatId, clearWaitpoint]);

  const question = questions[index];
  if (!question) return null;

  const isLast = index === questions.length - 1;
  const canGoNext = answers[question.id] !== undefined && !isLast;

  const submit = async (body: RespondWaitpointInput) => {
    setSubmitting(true);
    try {
      await respond.mutateAsync({ waitpointId, body });
      clearWaitpoint(chatId);
    } catch {
      setSubmitting(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const next = { ...answers, [question.id]: answer };
    setAnswers(next);
    if (isLast) {
      submit({ answers: questions.map((q) => ({ questionId: q.id, question: q.question, answer: next[q.id] ?? "skipped" })) });
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleSkipAll = () => submit({ skip: true });

  return (
    <div className="mx-auto flex w-[900px] max-w-full flex-col gap-2" onKeyDown={(e) => e.key === "Escape" && handleSkipAll()}>
      <div className="rounded-24 border border-border-secondary bg-surface-primary">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="text-sm font-semibold text-text-primary">{question.question}</h2>
          <div className="flex shrink-0 items-center gap-3 text-sm text-text-secondary">
            <button
              type="button"
              aria-label="Previous question"
              disabled={index === 0 || submitting}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span>
              {index + 1} of {questions.length}
            </span>
            <button
              type="button"
              aria-label="Next question"
              disabled={!canGoNext || submitting}
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Skip all questions"
              disabled={submitting}
              onClick={handleSkipAll}
              className="text-text-tertiary hover:text-text-primary disabled:opacity-30"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="border-t border-border-secondary">
          {question.type === "choice" ? (
            <WaitpointChoiceQuestion
              key={question.id}
              question={question}
              disabled={submitting}
              onAnswer={handleAnswer}
              onSkip={() => handleAnswer("skipped")}
            />
          ) : (
            <WaitpointTextQuestion
              key={question.id}
              question={question}
              disabled={submitting}
              onAnswer={handleAnswer}
              onSkip={() => handleAnswer("skipped")}
            />
          )}
        </div>
      </div>

      <p aria-live="polite" className="text-center text-xs text-text-tertiary">
        {question.type === "choice" ? "↑ ↓ to navigate · Esc to skip" : "Enter to submit · Esc to skip"}
      </p>
    </div>
  );
}
