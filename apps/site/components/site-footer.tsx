"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const markdownFor = (path: string) => (path === "/docs" ? "/docs.md" : path.startsWith("/docs/") ? `${path}.md` : null);

export function SiteFooter() {
  const md = markdownFor(usePathname());
  return (
    <footer className="mt-20 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-6 text-[13px] leading-[21.125px] text-fg-3">
      <Link href="/docs/agents" className="transition-colors duration-150 ease-out hover:text-fg-1">
        For agents
      </Link>
      {md && (
        <a href={md} className="transition-colors duration-150 ease-out hover:text-fg-1">
          This page as Markdown
        </a>
      )}
      <a href="/llms.txt" className="transition-colors duration-150 ease-out hover:text-fg-1">
        llms.txt
      </a>
    </footer>
  );
}
