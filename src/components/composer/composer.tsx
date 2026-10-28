"use client";

import { ArrowUp, ListChecks, Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";
import { ComposerContext, useComposer } from "./composer-context";

const MAX_TEXTAREA_HEIGHT = 384;

function ComposerProvider({
  children,
  onSubmit,
}: {
  children: React.ReactNode;
  onSubmit?: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const [planMode, setPlanMode] = useState(false);

  const submit = () => {
    if (!value.trim()) return;
    onSubmit?.(value);
  };

  return (
    <ComposerContext.Provider
      value={{ value, setValue, planMode, togglePlanMode: () => setPlanMode((p) => !p), submit }}
    >
      {children}
    </ComposerContext.Provider>
  );
}

function ComposerRoot({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto flex w-[900px] max-w-full flex-col gap-3 rounded-24 bg-gradient-to-b from-surface-primary to-surface-main-background px-4 pt-4 pb-3",
        className,
      )}
      {...props}
    />
  );
}

function ComposerTextarea() {
  const { value, setValue, submit } = useComposer();
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        resize(e.target);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      }}
      placeholder="Assign a task or ask anything..."
      rows={1}
      className="max-h-[384px] min-h-6 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-text-primary placeholder:text-text-secondary focus:outline-none"
    />
  );
}

function ComposerActions() {
  const { planMode, togglePlanMode, submit, value } = useComposer();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <IconButton aria-label="Attach files">
          <Paperclip />
        </IconButton>
        <IconButton aria-label="Plan mode" aria-pressed={planMode} onClick={togglePlanMode}>
          <ListChecks />
        </IconButton>
      </div>

      <IconButton
        aria-label="Send"
        disabled={!value.trim()}
        onClick={submit}
        className="bg-surface-main-background text-text-primary hover:bg-surface-main-background"
      >
        <ArrowUp />
      </IconButton>
    </div>
  );
}

export { ComposerProvider, ComposerRoot, ComposerTextarea, ComposerActions };
