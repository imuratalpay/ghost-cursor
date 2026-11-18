import { llmsTxt, markdownResponse } from "@/lib/agent-docs";

export async function GET(request: Request) {
  return markdownResponse(llmsTxt(new URL(request.url).origin), "text/plain");
}
