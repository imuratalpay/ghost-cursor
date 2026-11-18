export const DOCS = [
  { href: "/docs", title: "Getting started" },
  { href: "/docs/recording", title: "Recording" },
  { href: "/docs/agent-skill", title: "Agent skill" },
  { href: "/docs/api", title: "API" },
  { href: "/docs/examples", title: "Examples" },
  { href: "/docs/agents", title: "For agents" },
] as const;

/** Previous and next pages in reading order. */
export function neighbors(href: (typeof DOCS)[number]["href"]) {
  const i = DOCS.findIndex((p) => p.href === href);
  return { prev: DOCS[i - 1], next: DOCS[i + 1] };
}
