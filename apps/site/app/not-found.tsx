import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main id="content" className="mx-auto max-w-[684px] px-5 pt-16 pb-24">
      <h1 className="text-title text-fg-1">There's nothing at this address.</h1>
      <p className="my-4">
        <Link href="/" className="link">
          Go home
        </Link>
      </p>
    </main>
  );
}
