"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/waitpoint";
import { Button } from "@/components/ui/button";

export function WaitpointChoiceQuestion({
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
  const options = question.options ?? [];
  const itemCount = options.length + (question.allowOther ? 1 : 0);
  const [selected, setSelected] = useState(0);
  const [otherMode, setOtherMode] = useState(false);
  const [otherText, setOtherText] = useState("");

  const confirmSelected = () => {
    if (selected === options.length) {
      setOtherMode(true);
      return;
    }
    const option = options[selected];
    if (option) onAnswer(option.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (otherMode) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => Math.min(itemCount - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      confirmSelected();
    }
  };

  return (
    <div role="radiogroup" aria-label={question.question} onKeyDown={handleKeyDown}>
      <div className="divide-y divide-border-secondary/60">
        {options.map((option, i) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected === i}
            disabled={disabled}
            onClick={() => {
              setSelected(i);
              onAnswer(option.id);
            }}
            className={cn(
              "flex w-full items-start gap-3 px-5 py-3.5 text-left transition disabled:pointer-events-none",
              selected === i ? "bg-surface-hover" : "hover:bg-surface-hover/60",
            )}
          >
            <span className="w-5 shrink-0 text-sm text-text-tertiary">{i + 1}</span>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-text-primary">{option.label}</span>
              {option.recommended && (
                <span className="ml-2 rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
                  Recommended
                </span>
              )}
              {option.description && <p className="mt-0.5 text-xs text-text-secondary">{option.description}</p>}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-secondary px-5 py-3">
        {question.allowOther && !otherMode && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setSelected(options.length);
              setOtherMode(true);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-8 px-1.5 py-1 text-sm transition disabled:pointer-events-none",
              selected === options.length ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
            )}
          >
            <Pencil className="size-3.5" />
            Something else
          </button>
        )}

        {otherMode && (
          <input
            autoFocus
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && otherText.trim()) {
                e.preventDefault();
                onAnswer(otherText.trim());
              }
            }}
            disabled={disabled}
            placeholder="Type your answer…"
            className="flex-1 rounded-10 border border-border-secondary bg-surface-secondary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        )}

        <Button type="button" variant="secondary" disabled={disabled} onClick={onSkip} className="ml-auto">
          Skip
        </Button>
      </div>
    </div>
  );
}
