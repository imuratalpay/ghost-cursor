import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex h-16 items-center justify-between text-[14px] leading-[22.75px]">
      <Link href="/" className="-m-2 rounded-lg p-2 font-heading text-fg-1">
        ghost-cursor
      </Link>
      <Link
        href="/docs"
        className="-m-2 rounded-lg p-2 text-fg-3 transition-colors duration-150 ease-out hover:text-fg-1"
      >
        Docs
      </Link>
    </header>
  );
}
