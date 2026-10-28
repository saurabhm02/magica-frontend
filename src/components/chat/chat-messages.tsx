"use client";

import Link from "next/link";
import { useMessages } from "@/queries/messages";
import { ApiError } from "@/services/api-client";

export function ChatMessages({ chatId }: { chatId: string }) {
  const { data, isPending, isError, error } = useMessages(chatId);

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

  const messages = [...data.pages.flatMap((page) => page.items)].reverse();

  return (
    <div className="flex flex-col gap-4 p-6">
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col gap-1">
          <p className="text-xs text-text-tertiary">{message.role}</p>
          {message.content.map((block, i) =>
            block.type === "text" ? (
              <p key={i} className="text-sm text-text-primary">
                {block.text}
              </p>
            ) : null,
          )}
        </div>
      ))}
    </div>
  );
}
