import { MARKDOWN, markdownResponse, render } from "@/lib/agent-docs";

/** /docs/<page>.md: the Markdown version of each docs page. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = MARKDOWN[`/docs/${slug}`];
  if (!key) return new Response("Not found", { status: 404 });
  return markdownResponse(render(key, new URL(request.url).origin));
}
