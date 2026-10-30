"use client";

import { useState } from "react";
import type { Question } from "@/lib/waitpoint";
import { Button } from "@/components/ui/button";

export function WaitpointTextQuestion({
  question,
  disabled,
  onAnswer,
  onSkip,
}: {
  question: Question;
  disabled: boolean;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (value.trim()) onAnswer(value.trim());
  };

  return (
    <div>
      <div className="px-5 py-4">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          placeholder={question.placeholder}
          aria-label={question.question}
          className="w-full rounded-10 border border-border-secondary bg-surface-secondary px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border-secondary px-5 py-3">
        <Button type="button" variant="secondary" disabled={disabled} onClick={onSkip}>
          Skip
        </Button>
        <Button type="button" disabled={disabled || !value.trim()} onClick={submit}>
          Submit
        </Button>
      </div>
    </div>
  );
}
