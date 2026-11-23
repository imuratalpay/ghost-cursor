import type { Metadata } from "next";
import { Suspense } from "react";
import { PlaybackHarness } from "./harness";

// Mounted by tests/playback-api.spec.ts. Not linked, not in the sitemap.
export const metadata: Metadata = {
  title: "Playback test",
  robots: { index: false, follow: false },
};

export default function PlaybackTest() {
  return (
    <main id="content" className="mx-auto max-w-[684px] px-5 pt-16 pb-24">
      <Suspense>
        <PlaybackHarness />
      </Suspense>
    </main>
  );
}
