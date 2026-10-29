import { Copy, Loader2 } from "lucide-react";
import type { ToolRunAsset } from "@/contracts/api";
import type { SafeError } from "@/contracts/errors";

export type OutputStatus = "idle" | "running" | "succeeded" | "failed" | "cancelled";

export function OutputCard({
  status,
  error,
  assets,
}: {
  status: OutputStatus;
  error?: SafeError | null;
  assets: ToolRunAsset[];
}) {
  return (
    <div className="flex flex-1 flex-col rounded-16 border border-border-secondary bg-surface-primary">
      <div className="border-b border-border-secondary p-4">
        <h2 className="text-sm font-semibold text-text-primary">Output</h2>
        <p className="text-xs text-text-secondary">Results from model execution</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        {status === "idle" && (
          <div className="flex flex-col items-center gap-2 text-center">
            <Copy className="size-8 text-text-tertiary" />
            <p className="text-sm font-semibold text-text-primary">No output yet</p>
            <p className="text-xs text-text-secondary">Configure inputs and click generate</p>
          </div>
        )}

        {status === "running" && (
          <div className="flex flex-col items-center gap-2 text-center">
            <Loader2 className="size-6 animate-spin text-text-tertiary" />
            <p className="text-sm text-text-secondary">Running…</p>
          </div>
        )}

        {status === "failed" && <p className="text-sm text-error">{error?.message ?? "Something went wrong."}</p>}
        {status === "cancelled" && <p className="text-sm text-text-secondary">Cancelled</p>}

        {status === "succeeded" && (
          <div className="flex w-full flex-col items-center gap-3">
            {assets.map((asset, i) =>
              asset.type === "video" ? (
                <video key={i} src={asset.url} controls className="max-h-[480px] max-w-full rounded-10" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={asset.url}
                  alt="Generated output"
                  className="max-h-[480px] max-w-full rounded-10 object-contain"
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
