"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ContentBlock } from "@/contracts/content-blocks";
import type { Message } from "@/contracts/message";
import { formatCredits } from "@/lib/constants";
import { getMediaFromToolResult } from "@/lib/media";
import type { ArtifactAsset, StepItem } from "@/lib/types";
import { StepList } from "@/components/tools/step-list";
import { AssistantText } from "./assistant-text";
import { InterruptedCard } from "./interrupted-card";
import { MediaAssetList } from "./media-asset-list";

function toSteps(message: Message): { steps: StepItem[]; media: ArtifactAsset[] } {
  const toolResults = new Map<string, Extract<ContentBlock, { type: "tool_result" }>>();
  for (const block of message.content) {
    if (block.type === "tool_result") toolResults.set(block.toolUseId, block);
  }

  const steps: StepItem[] = [];
  const media: ArtifactAsset[] = [];

  for (const block of message.content) {
    if (block.type !== "tool_use") continue;
    const res = toolResults.get(block.id);
    const assets = getMediaFromToolResult(res);
    steps.push({
      id: block.id,
      name: block.name,
      renderKey: block.renderKey ?? block.name,
      status: res?.error ? "failed" : res?.output !== undefined ? "succeeded" : "pending",
      label: block.label,
      doneLabel: block.doneLabel,
      detail: block.detail,
      fields: block.fields,
      model: block.model,
      credits: res?.credits,
      error: res?.error,
      assets,
    });
    media.push(...assets);
  }

  return { steps, media };
}

function formatMessageTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

export function AssistantMessage({
  message,
  precedingUserText,
  onRetry,
}: {
  message: Message;
  precedingUserText?: string;
  onRetry?: (content: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const { steps, media } = toSteps(message);
  const textBlocks = message.content.filter((block) => block.type === "text").map((block) => block.text);
  const renderedUrls = new Set(media.map((asset) => asset.url));

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

      <MediaAssetList assets={media} />

      {message.status === "cancelled" && (
        <InterruptedCard onRetry={precedingUserText && onRetry ? () => onRetry(precedingUserText) : undefined} />
      )}

      {(message.status === "complete" || message.status === "cancelled") && (
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
    </div>
  );
}
