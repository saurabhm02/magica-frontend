import { Image as ImageIcon, Video, Wrench } from "lucide-react";
import Image from "next/image";
import type { ToolCategory } from "@/contracts/api";

// Magica's own icons for the three tools (Tabler "crop" and "layout-grid", and the OpenAI logo).
function CropIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M8 5v10a1 1 0 0 0 1 1h10" />
      <path d="M5 8h10a1 1 0 0 1 1 1v10" />
    </svg>
  );
}

function LayoutGridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
      <path d="M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
      <path d="M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
      <path d="M14 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" />
    </svg>
  );
}

const CATEGORY_ICON = { image: ImageIcon, video: Video, util: Wrench } satisfies Record<ToolCategory, unknown>;

export function ToolIcon({ name, category, className = "size-4" }: { name: string; category: ToolCategory; className?: string }) {
  if (name === "crop_image") return <CropIcon className={className} />;
  if (name === "merge_videos") return <LayoutGridIcon className={className} />;
  if (name === "gpt_image_2") {
    return <Image src="/model-logos/openai-image.webp" alt="" width={16} height={16} className={`${className} rounded-[3px]`} />;
  }
  const Icon = CATEGORY_ICON[category];
  return <Icon className={className} />;
}
