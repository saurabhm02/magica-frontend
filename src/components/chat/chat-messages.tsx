"use client";

import Link from "next/link";
import { memo } from "react";
import type { Message } from "@/contracts/message";
import { useMessages } from "@/queries/messages";
import { ApiError } from "@/services/api-client";
import { useLiveRunStore } from "@/stores/live-run.store";
import { AssistantMessage } from "./assistant-message";
import { SentAttachments } from "./sent-attachments";

export const ChatMessages = memo(function ChatMessages({
  chatId,
  onRetry,
}: {
  chatId: string;
  onRetry: (content: string) => void;
}) {
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
    .filter((message) => !(runActive && (message.status === "streaming" || message.status === "cancelled")))
    .reverse();

  return (
    // Same centered 900px column as Magica, with its padding and 24px between messages.
    <div className="mx-auto w-full max-w-[900px] pt-6">
      {messages.map((message, i) => (
        <div key={message.id} className="px-2 pb-6 sm:px-4">
          <MessageRow
            message={message}
            precedingUserText={precedingUserText(messages, i)}
            onRetry={runActive ? undefined : onRetry}
          />
        </div>
      ))}
    </div>
  );
});

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

function MessageRow({
  message,
  precedingUserText,
  onRetry,
}: {
  message: Message;
  precedingUserText?: string;
  onRetry?: (content: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <SentAttachments attachments={message.attachments} />
        <p className="max-w-[min(100%,28rem)] rounded-16 bg-surface-tertiary px-4 py-1.5 text-sm leading-5 break-words whitespace-pre-wrap text-text-primary">
          {textOf(message)}
        </p>
      </div>
    );
  }

  return <AssistantMessage message={message} precedingUserText={precedingUserText} onRetry={onRetry} />;
}
