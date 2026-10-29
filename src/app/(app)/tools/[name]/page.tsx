import { ToolDetail } from "@/components/tool-detail/tool-detail";

export default async function ToolDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  return <ToolDetail key={name} name={name} />;
}
