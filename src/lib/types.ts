import type { SafeError } from "@/contracts/errors";

export type StepField = { label: string; value: string };

export type StepItem = {
  id: string;
  name: string;
  renderKey: string;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  startedAt?: string;
  finishedAt?: string;
  label?: string;
  doneLabel?: string;
  detail?: string;
  fields?: StepField[];
  credits?: number;
  model?: string;
  error?: SafeError | string;
  assets?: ArtifactAsset[];
};

export type ArtifactAsset = {
  type: "image" | "video" | "audio";
  url: string;
  title?: string;
};

export type ArtifactPanelState = {
  step?: StepItem;
  asset?: ArtifactAsset;
};
