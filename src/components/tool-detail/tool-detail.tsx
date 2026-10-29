"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { useCreateToolRun, useToolDetail, useToolRun } from "@/queries/tools";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ApiTab } from "./api-tab";
import { InputCard } from "./input-card";
import { OutputCard, type OutputStatus } from "./output-card";
import { PricingCard } from "./pricing-card";
import { RunHistoryCard } from "./run-history-card";

const TERMINAL_TOOL_STATUSES = ["succeeded", "failed", "cancelled"];

export function ToolDetail({ name }: { name: string }) {
  const { data: tool, isPending, isError } = useToolDetail(name);
  const [tab, setTab] = useState<"playground" | "api">("playground");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [activeRunId, setActiveRunId] = useState<string | null>(searchParams.get("run"));
  const [freshRealtime, setFreshRealtime] = useState<{ runId: string; accessToken: string } | null>(null);
  const toolRun = useToolRun(activeRunId);
  const createRun = useCreateToolRun(name);

  const isDbTerminal = !!toolRun.data && TERMINAL_TOOL_STATUSES.includes(toolRun.data.status);
  const realtime = freshRealtime ?? toolRun.data?.realtime ?? null;
  const { run } = useRealtimeRun(realtime?.runId, {
    id: realtime?.runId ?? "",
    accessToken: realtime?.accessToken ?? "",
    enabled: !!realtime && !isDbTerminal,
  });

  useEffect(() => {
    if (!run?.finishedAt || isDbTerminal) return;
    toolRun.refetch();
    queryClient.invalidateQueries({ queryKey: queryKeys.credits });
    queryClient.invalidateQueries({ queryKey: queryKeys.creditLedger });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.finishedAt, isDbTerminal]);

  const handleGenerate = async (input: Record<string, unknown>) => {
    const res = await createRun.mutateAsync({ input });
    setFreshRealtime(res.realtime);
    setActiveRunId(res.runId);
    router.replace(`/tools/${name}?run=${res.runId}`, { scroll: false });
  };

  if (isPending) return <p className="p-6 text-sm text-text-secondary">Loading…</p>;
  if (isError || !tool) return <p className="p-6 text-sm text-text-secondary">Couldn&apos;t load this tool.</p>;

  const outputStatus: OutputStatus = !activeRunId
    ? "idle"
    : isDbTerminal && toolRun.data
    ? (toolRun.data.status as OutputStatus)
    : "running";

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <h1 className="text-2xl font-bold text-text-primary">
        <Link href="/tools" className="text-text-secondary underline hover:text-text-primary">
          Tools
        </Link>
        {" / "}
        {tool.displayName}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">{tool.description}</p>

      <div className="mt-6">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { label: "Playground", value: "playground" },
            { label: "API", value: "api" },
          ]}
        />
      </div>

      {tab === "playground" ? (
        <>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row">
            <InputCard
              schema={tool.inputs}
              estimatedCredits={tool.defaultEstimate}
              isGenerating={createRun.isPending || (!!activeRunId && !isDbTerminal)}
              onGenerate={handleGenerate}
            />
            <OutputCard
              status={outputStatus}
              error={toolRun.data?.error}
              assets={isDbTerminal ? (toolRun.data?.assets ?? []) : []}
            />
          </div>

          <RunHistoryCard toolName={name} />
          <PricingCard lines={tool.pricingLines} estimatedCredits={tool.defaultEstimate} />
        </>
      ) : (
        <div className="mt-6">
          <ApiTab toolName={name} schema={tool.inputs} />
        </div>
      )}
    </div>
  );
}
