"use client";

import { useState } from "react";
import { Check, Coins, Copy, GitFork, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ContentBlock } from "@/contracts/content-blocks";
import type { Message } from "@/contracts/message";
import { formatCredits, formatUsage, NOT_AVAILABLE_TOOLTIP } from "@/lib/constants";
import { getMediaFromToolResult } from "@/lib/media";
import { REASONING_RENDER_KEY } from "@/lib/reasoning";
import type { ArtifactAsset, StepField, StepItem } from "@/lib/types";
import { parseAnswers, parsePlanOutput, parseQuestions } from "@/lib/waitpoint";
import { StepList } from "@/components/tools/step-list";
import { AssistantText } from "./assistant-text";
import { CitationsList } from "./citations-list";
import { InterruptedCard } from "./interrupted-card";
import { MediaAssetList } from "./media-asset-list";

function toSteps(message: Message): { steps: StepItem[]; media: ArtifactAsset[] } {
  const toolResults = new Map<string, Extract<ContentBlock, { type: "tool_result" }>>();
  for (const block of message.content) {
    if (block.type === "tool_result") toolResults.set(block.toolUseId, block);
  }

  const steps: StepItem[] = [];
  const media: ArtifactAsset[] = [];

  message.content.forEach((block, i) => {
    // Thinking that led to a tool call shows as its own row, like Magica.
    if (block.type === "reasoning") {
      const next = message.content.slice(i + 1).find((b) => b.type !== "text");
      if (next?.type === "tool_use") {
        steps.push({
          id: `reasoning_${i}`,
          name: REASONING_RENDER_KEY,
          renderKey: REASONING_RENDER_KEY,
          status: "succeeded",
          label: block.title,
          text: block.text,
        });
      }
      return;
    }
    if (block.type !== "tool_use") return;
    const res = toolResults.get(block.id);
    const assets = getMediaFromToolResult(res);
    const renderKey = block.renderKey ?? block.name;
    const isWaitpointStep = renderKey === "request-user-options";
    const isPlanStep = renderKey === "plan";
    const resolved = res?.output !== undefined;
    const planOutput = isPlanStep && resolved ? parsePlanOutput(res?.output) : null;
    const planLabel = planOutput
      ? planOutput.status === "changes_requested"
        ? `Plan changes requested ${block.input.title ?? ""}`
        : `Plan approved ${block.input.title ?? ""} (${planOutput.steps?.length ?? 0} steps)`
      : null;
    steps.push({
      id: block.id,
      name: block.name,
      renderKey,
      status: res?.error ? "failed" : resolved ? "succeeded" : "pending",
      label: isWaitpointStep && resolved ? "User input received" : planLabel ?? block.label,
      doneLabel: block.doneLabel,
      detail: block.detail,
      fields: isWaitpointStep && resolved
        ? waitpointFields(block.input, res?.output)
        : isPlanStep && resolved
        ? planFields(block.input, planOutput)
        : block.fields,
      model: block.model,
      credits: res?.credits,
      error: res?.error,
      assets,
    });
    media.push(...assets);
  });

  return { steps, media };
}

function waitpointFields(input: Record<string, unknown>, output: unknown): StepField[] {
  const questions = parseQuestions(input.questions);
  const answers = parseAnswers((output as { answers?: unknown } | undefined)?.answers);
  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a.answer]));

  const fields: StepField[] = [];
  if (typeof input.message === "string") fields.push({ label: "Message", value: input.message });
  questions.forEach((q, i) => {
    const answer = answerByQuestionId.get(q.id) ?? "";
    fields.push({ label: `Q${i + 1} *`, value: `${q.question}\n→ ${answer}` });
  });
  return fields;
}

function planFields(input: Record<string, unknown>, planOutput: ReturnType<typeof parsePlanOutput>): StepField[] {
  const title = typeof input.title === "string" ? input.title : "";
  const overview = typeof input.overview === "string" ? input.overview : "";
  const steps = planOutput?.steps ?? [];
  const total = steps.reduce((sum, s) => sum + (s.estimatedCredits ?? 0), 0);

  const fields: StepField[] = [];
  if (title) fields.push({ label: "Title", value: title });
  if (overview) fields.push({ label: "Overview", value: overview });
  steps.forEach((s, i) => {
    const credits = s.estimatedCredits !== undefined ? ` (~${formatCredits(s.estimatedCredits, { precision: 4 })})` : "";
    fields.push({ label: `Step ${i + 1}`, value: `${s.title}${credits}\n${s.description}` });
  });
  fields.push({ label: "Total estimated", value: `~${formatCredits(total, { precision: 4 })}` });
  return fields;
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
  const citations = message.content.filter((block) => block.type === "citations").flatMap((block) => block.citations);
  const usage = message.content.find((block) => block.type === "usage");
  const renderedUrls = new Set(media.map((asset) => asset.url));

  const fullText = textBlocks.join("\n\n");
  const timeStr = formatMessageTime(message.createdAt);
  const turnTotalCredits = steps.reduce((sum, s) => sum + (s.credits ?? 0), 0);
  const formattedTurnCredits = turnTotalCredits > 0 ? `${formatCredits(turnTotalCredits)} credits` : undefined;
  const usageLine = usage && usage.totalTokens > 0 ? formatUsage(usage) : undefined;

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

      <CitationsList citations={citations} />

      <MediaAssetList assets={media} />

      {message.status === "cancelled" && (
        <InterruptedCard onRetry={precedingUserText && onRetry ? () => onRetry(precedingUserText) : undefined} />
      )}

      {(message.status === "complete" || message.status === "cancelled") && (
        <div className="flex flex-col gap-1.5 pt-1 text-xs text-text-tertiary">
          {usageLine && <span data-testid="message-usage" className="text-[12px] leading-4">{usageLine}</span>}
          {formattedTurnCredits && (
            <span data-testid="message-credits" className="flex items-center gap-1 text-[10px] leading-3">
              <Coins className="size-3" />
              {formattedTurnCredits}
            </span>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Copy message"
              onClick={handleCopy}
              className="transition hover:text-text-secondary"
            >
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </button>
            {/* Branch and feedback are look-only, like the other not-built Magica actions. */}
            {[
              { label: "Branch from here", icon: GitFork },
              { label: "Good response", icon: ThumbsUp },
              { label: "Bad response", icon: ThumbsDown },
            ].map(({ label, icon: Icon }) => (
              <button key={label} type="button" aria-label={label} aria-disabled="true" title={NOT_AVAILABLE_TOOLTIP} className="transition hover:text-text-secondary">
                <Icon className="size-4" />
              </button>
            ))}
            {timeStr && <span className="font-medium text-text-secondary">{timeStr}</span>}
          </div>
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
