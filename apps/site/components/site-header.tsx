import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex h-14 max-w-[1080px] items-center justify-between px-5 font-sans text-[14px]">
      <Link href="/" className="-mx-2 rounded-lg px-2 py-1 font-medium text-neutral-900">
        ghost-cursor
      </Link>
      <nav aria-label="Site" className="flex items-center gap-1 text-neutral-500">
        <Link
          href="/docs"
          className="rounded-lg px-2.5 py-1.5 transition-colors duration-150 ease-out hover:text-neutral-900"
        >
          Docs
        </Link>
        <Link
          href="/docs/examples"
          className="rounded-lg px-2.5 py-1.5 transition-colors duration-150 ease-out hover:text-neutral-900"
        >
          Examples
        </Link>
      </nav>
    </header>
  );
}
