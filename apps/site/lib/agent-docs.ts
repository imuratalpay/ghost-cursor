import { pages } from "@/content/generated";

export type PageKey = keyof typeof pages;

/** Markdown routes: the URL an agent asks for, and the page it gets. */
export const MARKDOWN: Record<string, PageKey> = {
  "/docs.md": "getting-started",
  "/docs/recording.md": "recording",
  "/docs/agent-skill.md": "agent-skill",
  "/docs/api.md": "api",
  "/docs/examples.md": "examples",
  "/docs/agents.md": "agents",
};

const ORDER: PageKey[] = ["agents", "getting-started", "recording", "agent-skill", "api", "examples"];

/** Links and commands in the docs use the origin the request came from. */
export function render(key: PageKey, origin: string) {
  return pages[key].replaceAll("{{origin}}", origin);
}

export function llmsTxt(origin: string) {
  const links = Object.entries(MARKDOWN)
    .map(([path, key]) => `- [${pages[key].match(/^# (.+)$/m)?.[1] ?? key}](${origin}${path})`)
    .join("\n");
  return `# ghost-cursor

> React component demos that replay a recorded take over the real component, with real DOM events.

The full agent instructions follow. They are also at ${origin}/docs/agents.md.

${render("agents", origin).replace(/^# .+\n+/, "")}
## Docs as Markdown

${links}
- [Everything in one file](${origin}/llms-full.txt)
`;
}

export function llmsFullTxt(origin: string) {
  return ORDER.map((key) => render(key, origin).trim()).join("\n\n---\n\n") + "\n";
}

export function markdownResponse(body: string, type = "text/markdown") {
  return new Response(body, { headers: { "content-type": `${type}; charset=utf-8` } });
}
