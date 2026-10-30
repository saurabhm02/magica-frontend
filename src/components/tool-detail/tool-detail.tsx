"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { isFinished, useCreateToolRun, useToolDetail, useToolRun } from "@/queries/tools";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ApiTab } from "./api-tab";
import { InputCard, type GptImage2SubModel } from "./input-card";
import { OutputCard, type OutputStatus } from "./output-card";
import { PricingCard } from "./pricing-card";
import { RunHistoryCard } from "./run-history-card";


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

  const isDbTerminal = !!toolRun.data && isFinished(toolRun.data.status);
  const realtime = freshRealtime ?? toolRun.data?.realtime ?? null;
  const { run } = useRealtimeRun(realtime?.runId, {
    id: realtime?.runId ?? "",
    accessToken: realtime?.accessToken ?? "",
    enabled: !!realtime && !isDbTerminal,
  });

  useEffect(() => {
    if (!run?.finishedAt || isDbTerminal) return;
    toolRun.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.finishedAt, isDbTerminal]);

  // Keep Run History and the credit balance in step with the active run's status.
  const activeStatus = toolRun.data?.status;
  useEffect(() => {
    if (!activeStatus) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.toolRuns(name) });
    if (isFinished(activeStatus)) {
      queryClient.invalidateQueries({ queryKey: queryKeys.credits });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditLedger });
    }
  }, [activeStatus, name, queryClient]);

  const handleGenerate = async (input: Record<string, unknown>) => {
    const res = await createRun.mutateAsync({ input });
    setFreshRealtime(res.realtime);
    setActiveRunId(res.runId);
    router.replace(`/tools/${name}?run=${res.runId}`, { scroll: false });
  };

  const handleSelectRun = (runId: string) => {
    setFreshRealtime(null);
    setActiveRunId(runId);
    router.replace(`/tools/${name}?run=${runId}`, { scroll: false });
  };

  const handleNewRun = () => {
    setFreshRealtime(null);
    setActiveRunId(null);
    router.replace(`/tools/${name}`, { scroll: false });
  };

  const isGptImage2 = name === "gpt_image_2";
  const subModelValue = searchParams.get("subModel") === "gpt-image-2-edit" ? "edit" : "text";
  const subModel: GptImage2SubModel | undefined = isGptImage2
    ? {
        value: subModelValue,
        onChange: (value) => {
          const next = new URLSearchParams(searchParams);
          next.set("subModel", `gpt-image-2-${value}`);
          router.replace(`/tools/${name}?${next.toString()}`, { scroll: false });
        },
      }
    : undefined;

  if (isPending) return <p className="p-6 text-sm text-text-secondary">Loading…</p>;
  if (isError || !tool) return <p className="p-6 text-sm text-text-secondary">Couldn&apos;t load this tool.</p>;

  const outputStatus: OutputStatus = !activeRunId
    ? "idle"
    : isDbTerminal && toolRun.data
    ? (toolRun.data.status as OutputStatus)
    : "running";

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <h1 className="text-2xl leading-9 font-bold text-text-primary">
        <Link
          href="/tools"
          className="text-text-secondary underline decoration-[1.5px] underline-offset-4 hover:text-text-primary"
        >
          Tools
        </Link>
        {" / "}
        {tool.displayName}
        {isGptImage2 && ` — ${subModelValue === "edit" ? "Image to Image" : "Text to Image"}`}
      </h1>
      <p className="mt-1.5 text-sm text-text-secondary">{tool.description}</p>

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
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[460px_1fr]">
            <InputCard
              schema={tool.inputs}
              estimatedCredits={tool.defaultEstimate}
              isGenerating={createRun.isPending || (!!activeRunId && !isDbTerminal)}
              onGenerate={handleGenerate}
              onNewRun={handleNewRun}
              subModel={subModel}
            />
            <OutputCard
              status={outputStatus}
              error={toolRun.data?.error}
              assets={isDbTerminal ? (toolRun.data?.assets ?? []) : []}
              credits={toolRun.data?.credits}
            />
          </div>

          <RunHistoryCard toolName={name} activeRunId={activeRunId} onSelectRun={handleSelectRun} />
          <PricingCard lines={tool.pricingLines} estimatedCredits={tool.defaultEstimate} />
        </>
      ) : (
        <div className="mt-6">
          <ApiTab toolName={name} schema={tool.inputs} pricingLines={tool.pricingLines} estimatedCredits={tool.defaultEstimate} />
        </div>
      )}
    </div>
  );
}
