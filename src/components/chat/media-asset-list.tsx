import type { ArtifactAsset } from "@/lib/types";
import { MediaAsset } from "./media-asset";

export function MediaAssetList({ assets }: { assets: ArtifactAsset[] }) {
  if (assets.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[460px]">
      {assets.map((asset, i) => (
        <MediaAsset key={asset.url || i} asset={asset} />
      ))}
    </div>
  );
}
