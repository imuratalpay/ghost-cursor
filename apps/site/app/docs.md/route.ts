import { markdownResponse, render } from "@/lib/agent-docs";

export async function GET(request: Request) {
  return markdownResponse(render("getting-started", new URL(request.url).origin));
}
