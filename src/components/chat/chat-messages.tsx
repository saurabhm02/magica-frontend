"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentBlock } from "@/contracts/content-blocks";
import type { Message } from "@/contracts/message";
import { formatCredits } from "@/lib/constants";
import type { ArtifactAsset, StepItem } from "@/lib/types";
import { useMessages } from "@/queries/messages";
import { ApiError } from "@/services/api-client";
import { useLiveRunStore } from "@/stores/live-run.store";
import { StepList } from "@/components/tools/step-list";
import { MediaAsset } from "./media-asset";

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

function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

export function extractMediaFromOutput(output: unknown): ArtifactAsset[] {
  if (!output || typeof output !== "object") return [];
  const assets: ArtifactAsset[] = [];
  const rec = output as Record<string, unknown>;
  if (typeof rec.image_url === "string") {
    assets.push({ type: "image", url: rec.image_url });
  }
  if (Array.isArray(rec.images)) {
    for (const img of rec.images) {
      if (typeof img === "string") {
        assets.push({ type: "image", url: img });
      } else if (img && typeof img === "object" && typeof (img as Record<string, unknown>).url === "string") {
        assets.push({ type: "image", url: (img as Record<string, unknown>).url as string });
      }
    }
  }
  if (typeof rec.video_url === "string") {
    assets.push({ type: "video", url: rec.video_url });
  }
  return assets;
}

export function AssistantText({
  text,
  cursor,
  renderedUrls,
}: {
  text: string;
  cursor?: boolean;
  renderedUrls?: Set<string>;
}) {
  if (!text && !cursor) return null;

  return (
    <div className="text-sm text-text-primary leading-relaxed">
      {text ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt }) => {
              if (!src || typeof src !== "string") return null;
              if (renderedUrls?.has(src)) return null;
              renderedUrls?.add(src);
              return (
                <MediaAsset
                  asset={{
                    type: "image",
                    url: src,
                    title: typeof alt === "string" ? alt : undefined,
                  }}
                />
              );
            },
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-primary underline hover:text-text-secondary"
              >
                {children}
              </a>
            ),
            p: ({ children }) => (
              <div className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap">{children}</div>
            ),
            code: ({ className, children, ...props }) => {
              const isInline = !className && typeof children === "string" && !children.includes("\n");
              if (isInline) {
                return (
                  <code
                    className="rounded bg-surface-tertiary px-1 py-0.5 text-xs font-mono text-text-primary"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code
                  className="block overflow-x-auto rounded-10 bg-surface-tertiary p-3 text-xs font-mono text-text-primary my-2"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      ) : null}
      {cursor && <span className="animate-pulse ml-0.5">▍</span>}
    </div>
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
  const [copied, setCopied] = useState(false);

  if (message.role === "user") {
    const text = textOf(message);
    return (
      <div className="flex justify-end">
        <p className="max-w-[70%] rounded-16 bg-surface-tertiary px-4 py-2 text-sm whitespace-pre-wrap text-text-primary">
          {text}
        </p>
      </div>
    );
  }

  const toolResults = new Map<string, Extract<ContentBlock, { type: "tool_result" }>>();
  for (const block of message.content) {
    if (block.type === "tool_result") {
      toolResults.set(block.toolUseId, block);
    }
  }

  const steps: StepItem[] = [];
  const mediaAssets: ArtifactAsset[] = [];
  const textBlocks: string[] = [];
  const renderedUrls = new Set<string>();

  for (const block of message.content) {
    if (block.type === "tool_use") {
      const res = toolResults.get(block.id);
      const status = res?.error ? "failed" : res?.output !== undefined ? "succeeded" : "pending";
      steps.push({
        id: block.id,
        name: block.name,
        renderKey: block.name,
        status,
        label: block.label,
        doneLabel: block.doneLabel,
        detail: block.detail,
        fields: block.fields,
        model: block.model,
        credits: res?.credits,
        error: res?.error,
        output: res?.output,
      });

      if (res?.output) {
        const media = extractMediaFromOutput(res.output);
        media.forEach((m) => renderedUrls.add(m.url));
        mediaAssets.push(...media);
      }
    } else if (block.type === "text") {
      textBlocks.push(block.text);
    }
  }

  const fullText = textBlocks.join("\n\n");
  const timeStr = formatMessageTime(message.createdAt);
  const turnTotalCredits = steps.reduce((sum, s) => sum + (s.credits ?? 0), 0);
  const formattedTurnCredits = turnTotalCredits > 0 ? `${formatCredits(turnTotalCredits)} credits` : undefined;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-start gap-2.5 w-full">
      {steps.length > 0 && <StepList steps={steps} isLive={false} />}

      {textBlocks.map((t, idx) => (
        <AssistantText key={idx} text={t} renderedUrls={renderedUrls} />
      ))}

      {mediaAssets.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-[460px]">
          {mediaAssets.map((asset, idx) => (
            <MediaAsset key={asset.url || idx} asset={asset} />
          ))}
        </div>
      )}

      {message.status === "complete" && (
        <div className="flex items-center gap-3 text-xs text-text-tertiary pt-1">
          <button
            type="button"
            aria-label="Copy message"
            onClick={handleCopy}
            className="hover:text-text-secondary transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {formattedTurnCredits && <span data-testid="message-credits">{formattedTurnCredits}</span>}
          {timeStr && <span>{timeStr}</span>}
        </div>
      )}

      {message.status === "failed" && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-error">This reply failed.</p>
          {precedingUserText && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(precedingUserText)}
              className="text-sm text-text-primary underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {message.status === "cancelled" && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-text-secondary">Stopped</p>
          {precedingUserText && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(precedingUserText)}
              className="text-sm text-text-primary underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
