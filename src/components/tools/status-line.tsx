"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cleanReasoning } from "@/lib/reasoning";
import { cn } from "@/lib/utils";

const STATUS_TEXT = {
  thinking: "Thinking",
  waiting: "Waiting for you",
  stopping: "Stopping generation…",
} as const;

// Magica shows "› Thinking" with a shimmer and no timer. The chevron is a toggle: it turns
// down and opens the model's reasoning as it streams in.
export function StatusLine({ status, reasoning }: { status: keyof typeof STATUS_TEXT; reasoning?: string }) {
  const [open, setOpen] = useState(false);
  const label = <span className="text-shimmer">{STATUS_TEXT[status]}</span>;

  if (status !== "thinking") {
    return (
      <div aria-live="polite" className="flex items-center gap-1 text-sm text-text-secondary">
        {label}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-live="polite"
        onClick={() => setOpen((v) => !v)}
        className="flex w-fit items-center gap-1 text-sm text-text-secondary"
      >
        <ChevronRight
          className={cn("size-3.5 shrink-0 transition-transform duration-200", open && "rotate-90")}
          strokeWidth={1.75}
        />
        {label}
      </button>
      {open && reasoning && <ReasoningText text={reasoning} />}
    </div>
  );
}

// Keeps the newest thinking in view while it streams.
function ReasoningText({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);

  return (
    <div
      ref={ref}
      className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-16 border border-border-secondary bg-surface-primary px-3 py-2.5 text-[13px] leading-5 text-text-secondary"
    >
      {cleanReasoning(text)}
    </div>
  );
}
