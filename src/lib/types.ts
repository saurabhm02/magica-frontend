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
  text?: string; // a reasoning step's raw thinking
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

export type AttachmentItem = {
  id: string;
  name: string;
  kind: "image" | "video" | "audio";
  previewUrl?: string;
  progress: number;
  status: "uploading" | "ready" | "failed";
  error?: string;
  attachmentId?: string;
  url?: string;
};

export type PreviewItem = {
  url: string;
  kind: "image" | "video" | "audio";
  name: string;
  source: "upload" | "generated";
  createdAt?: string;
  sizeBytes?: number;
  prompt?: string;
};
