"use client";

import Link from "next/link";
import type { Message } from "@/contracts/message";
import { useMessages } from "@/queries/messages";
import { ApiError } from "@/services/api-client";
import { useLiveRunStore } from "@/stores/live-run.store";

export function ChatMessages({ chatId, onRetry }: { chatId: string; onRetry: (content: string) => void }) {
  const { data, isPending, isError, error } = useMessages(chatId);
  const runActive = useLiveRunStore((s) => !!s.runs[chatId] && s.runs[chatId].status !== "failed");

  if (isPending) {
    return <p className="p-6 text-sm text-text-secondary">Loading…</p>;
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <p className="text-sm text-text-secondary">Chat not found</p>
          <Link href="/" className="text-sm text-text-primary underline">
            Go home
          </Link>
        </div>
      );
    }
    return <p className="p-6 text-sm text-text-secondary">Couldn&apos;t load this chat.</p>;
  }


  const messages = data.pages
    .flatMap((page) => page.items)
    .filter((message) => !(runActive && message.status === "streaming"))
    .reverse();

  return (
    <div className="flex flex-col gap-4 p-6">
      {messages.map((message, i) => (
        <MessageRow
          key={message.id}
          message={message}
          precedingUserText={precedingUserText(messages, i)}
          onRetry={runActive ? undefined : onRetry}
        />
      ))}
    </div>
  );
}

function precedingUserText(messages: Message[], index: number) {
  const prev = messages[index - 1];
  return prev?.role === "user" ? textOf(prev) : undefined;
}

function textOf(message: Message) {
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export function AssistantText({ text, cursor }: { text: string; cursor?: boolean }) {
  return (
    <p className="text-sm whitespace-pre-wrap text-text-primary">
      {text}
      {cursor && <span className="animate-pulse">▍</span>}
    </p>
  );
}

function MessageRow({
  message,
  precedingUserText,
  onRetry,
}: {
  message: Message;
  precedingUserText?: string;
  onRetry?: (content: string) => void;
}) {
  const text = textOf(message);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[70%] rounded-16 bg-surface-tertiary px-4 py-2 text-sm whitespace-pre-wrap text-text-primary">
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <AssistantText text={text} />
      {message.status === "failed" && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-error">This reply failed.</p>
          {precedingUserText && onRetry && (
            <button type="button" onClick={() => onRetry(precedingUserText)} className="text-sm text-text-primary underline">
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
