import { llmsFullTxt, markdownResponse } from "@/lib/agent-docs";

export async function GET(request: Request) {
  return markdownResponse(llmsFullTxt(new URL(request.url).origin), "text/plain");
}
