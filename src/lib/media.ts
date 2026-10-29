import type { ContentBlock } from "@/contracts/content-blocks";
import type { ArtifactAsset } from "@/lib/types";

type ToolResultBlock = Extract<ContentBlock, { type: "tool_result" }>;

export function getMediaFromToolResult(result?: ToolResultBlock): ArtifactAsset[] {
  if (result?.assets && result.assets.length > 0) return result.assets;
  return sniffMediaFromOutput(result?.output);
}

function sniffMediaFromOutput(output: unknown): ArtifactAsset[] {
  if (!output || typeof output !== "object") return [];
  const rec = output as Record<string, unknown>;
  const assets: ArtifactAsset[] = [];

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
