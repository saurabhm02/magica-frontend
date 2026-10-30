"use client";

import { ArrowUp, AudioLines, Folder, ListChecks, Mic, Paperclip, Plug, Puzzle, Square } from "lucide-react";
import { useRef, useState } from "react";
import { NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";
import { ComposerContext, useComposer } from "./composer-context";

const MAX_TEXTAREA_HEIGHT = 384;

// Composer buttons: grey icon, darker round background on hover (measured on magica.com).
const actionClassName = "hover:bg-surface-main-background-2 hover:text-text-primary";

function ComposerProvider({
  children,
  onSubmit,
  onStop,
  disabled = false,
}: {
  children: React.ReactNode;
  onSubmit?: (value: string, planMode: boolean) => void | Promise<void>;
  onStop?: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (disabled || !value.trim() || !onSubmit) return;
    const text = value;
    setError(null);
    setValue("");
    try {
      await onSubmit(text, planMode);
    } catch (err) {
      setValue(text);
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const stop = async () => {
    if (!onStop) return;
    setError(null);
    try {
      await onStop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <ComposerContext.Provider
      value={{ value, setValue, planMode, togglePlanMode: () => setPlanMode((p) => !p), disabled, error, submit, stop }}
    >
      {children}
    </ComposerContext.Provider>
  );
}

function ComposerRoot({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group/composer relative mx-auto flex max-h-[70vh] min-h-[132px] w-[900px] max-w-full flex-col gap-3 overflow-clip rounded-24 bg-surface-main-background-3 px-4 pt-4 pb-3",
        className,
      )}
      {...props}
    >
      {/* Magica draws the composer border as a separate layer so it can brighten on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-24 shadow-[inset_0_0_0_0.3px_var(--color-border-tertiary)] transition-shadow group-hover/composer:shadow-[inset_0_0_0_1px_rgb(169_169_169/0.55)]"
      />
      {children}
    </div>
  );
}

function ComposerTextarea({ placeholder = "Assign a task or ask anything..." }: { placeholder?: string }) {
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
      placeholder={placeholder}
      rows={1}
      className="max-h-[384px] min-h-6 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-text-primary placeholder:text-text-tertiary focus:outline-none"
    />
  );
}

function ComposerActions() {
  const { planMode, togglePlanMode, submit, stop, value, disabled } = useComposer();
  const hasText = !!value.trim();

  return (
    <div className="mt-auto flex items-center justify-between gap-1">
      <div className="flex min-w-0 items-center gap-1">
        <IconButton aria-label="Attach files" title="Attach files" className={actionClassName}>
          <Paperclip strokeWidth={1.75} />
        </IconButton>
        <IconButton
          aria-label="Choose project"
          aria-disabled="true"
          title={NOT_AVAILABLE_TOOLTIP}
          className={cn(actionClassName, "w-auto max-w-56 gap-1 px-2 text-sm font-medium")}
        >
          <Folder strokeWidth={1.75} />
          <span className="truncate">Choose project</span>
        </IconButton>
        <IconButton aria-label="Skills" aria-disabled="true" title={NOT_AVAILABLE_TOOLTIP} className={actionClassName}>
          <Puzzle strokeWidth={1.75} />
        </IconButton>
        <IconButton aria-label="Connect apps" aria-disabled="true" title={NOT_AVAILABLE_TOOLTIP} className={actionClassName}>
          <Plug strokeWidth={1.75} className="-rotate-45" />
        </IconButton>
        <IconButton aria-label="Plan mode" title="Plan mode" aria-pressed={planMode} onClick={togglePlanMode} className={actionClassName}>
          <ListChecks strokeWidth={1.75} />
        </IconButton>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <IconButton aria-label="Meeting minutes" aria-disabled="true" title={NOT_AVAILABLE_TOOLTIP} className={actionClassName}>
          <AudioLines strokeWidth={1.75} />
        </IconButton>
        <IconButton aria-label="Dictation" aria-disabled="true" title={NOT_AVAILABLE_TOOLTIP} className={actionClassName}>
          <Mic strokeWidth={1.75} />
        </IconButton>

        {disabled ? (
          <IconButton
            aria-label="Stop"
            type="button"
            onClick={stop}
            className="bg-[#dc2626] text-white hover:bg-red-700"
          >
            <Square className="h-3 w-3 fill-current" />
          </IconButton>
        ) : (
          <IconButton
            aria-label="Send message"
            disabled={!hasText}
            title={hasText ? undefined : "Add a message first"}
            onClick={submit}
            className="bg-action text-white hover:bg-action hover:text-white hover:opacity-90 disabled:bg-surface-main-background-2 disabled:text-text-secondary disabled:opacity-50"
          >
            <ArrowUp />
          </IconButton>
        )}
      </div>
    </div>
  );
}

function ComposerError() {
  const { error } = useComposer();
  if (!error) return null;
  return <p className="mx-auto w-[900px] max-w-full text-sm text-error">{error}</p>;
}

export { ComposerProvider, ComposerRoot, ComposerTextarea, ComposerActions, ComposerError };
