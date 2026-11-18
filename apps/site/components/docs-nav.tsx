"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS } from "./docs-pages";

export function DocsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] leading-[22.75px]">
        {DOCS.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              aria-current={pathname === page.href ? "page" : undefined}
              className="text-fg-3 transition-colors duration-150 ease-out hover:text-fg-1 aria-[current=page]:text-fg-1"
            >
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
