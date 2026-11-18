"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/docs", label: "Getting started" },
  { href: "/docs/api", label: "API" },
  { href: "/docs/recording", label: "Recording" },
  { href: "/docs/examples", label: "Examples" },
];

export function DocsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {PAGES.map((page) => {
          const current = pathname === page.href;
          return (
            <li key={page.href} className="flex-none">
              <Link
                href={page.href}
                aria-current={current ? "page" : undefined}
                className="block rounded-lg px-3 py-1.5 text-[14px] text-neutral-500 transition-colors duration-150 ease-out hover:text-neutral-900 aria-[current=page]:bg-black/[0.05] aria-[current=page]:text-neutral-900"
              >
                {page.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
