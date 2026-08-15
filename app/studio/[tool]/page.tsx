import { ToolWorkbench } from "@/src/components/tool-workbench";

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  return <ToolWorkbench toolId={tool} />;
}
