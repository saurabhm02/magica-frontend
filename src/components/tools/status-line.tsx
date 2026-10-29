const STATUS_TEXT = {
  thinking: "Thinking",
  waiting: "Waiting for you",
  stopping: "Stopping generation…",
} as const;

export function StatusLine({
  status,
  elapsed,
}: {
  status: keyof typeof STATUS_TEXT;
  elapsed?: number;
}) {
  const text = status === "thinking" && elapsed ? `Thinking… ${elapsed}s` : STATUS_TEXT[status];

  return (
    <div aria-live="polite" className="flex items-center gap-1.5 text-sm text-text-secondary">
      {text}
    </div>
  );
}
