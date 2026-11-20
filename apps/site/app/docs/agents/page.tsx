import type { Metadata } from "next";
import { marked } from "marked";
import { headers } from "next/headers";
import { Suspense } from "react";
import { neighbors } from "@/components/docs-pages";
import { PrevNext } from "@/components/prose";
import { render } from "@/lib/agent-docs";

export const metadata: Metadata = {
  title: "For agents",
  alternates: { canonical: "https://ghost-cursor.muratalpay.me/docs/agents", types: { "text/markdown": "/docs/agents.md" } },
};

/** The same Markdown agents get from /docs/agents.md, with commands pointing at this host. */
async function Body() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "ghost-cursor.muratalpay.me";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const html = marked.parse(render("agents", `${proto}://${host}`), { async: false });
  return <div className="md-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function Agents() {
  return (
    <>
      <Suspense>
        <Body />
      </Suspense>
      <PrevNext {...neighbors("/docs/agents")} />
    </>
  );
}
