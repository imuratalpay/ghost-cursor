import Link from "next/link";
import { StickyHeader } from "./sticky-header";

const REPO = "https://github.com/imuratalpay/ghost-cursor";

export function SiteHeader() {
  return (
    <StickyHeader>
      <div className="flex h-16 items-center gap-3 px-5 text-secondary">
        <Link href="/" className="-mx-2 flex min-h-10 items-center rounded-lg px-2 font-heading text-fg-1">
          <span className="text-fg-3">/</span>ghost-cursor
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/docs"
            className="-mx-2 flex min-h-10 items-center rounded-lg px-2 text-fg-3 transition-colors duration-(--duration-quick) ease-out hover:text-fg-1"
          >
            Docs
          </Link>
          <a
            href={REPO}
            className="-mx-2 hidden min-h-10 items-center rounded-lg px-2 text-fg-3 transition-colors duration-(--duration-quick) ease-out hover:text-fg-1 sm:flex"
          >
            GitHub
          </a>
        </div>
      </div>
    </StickyHeader>
  );
}
