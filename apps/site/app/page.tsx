import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SortMenu } from "@/components/demos/sort-menu";
import { ViewSettings } from "@/components/demos/view-settings";
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import sortRecording from "@/recordings/sort-menu.json";
import viewRecording from "@/recordings/view-settings.json";

const usage = `import { GhostCursor } from "@psychedelichip/ghost-cursor";
import recording from "./sort-menu.json";

<GhostCursor recording={recording}>
  <SortMenu />
</GhostCursor>`;

function excerpt(rec: typeof sortRecording, lines = 6) {
  const head = JSON.stringify({ v: rec.v, size: rec.size, targets: rec.targets }).slice(0, -1);
  const events = rec.events.slice(0, lines).map((e) => "  " + JSON.stringify(e));
  return `${head},"events":[\n${events.join(",\n")},\n  …\n]}`;
}

function Code({ children }: { children: string }) {
  return (
    <pre className="prose-code my-7 overflow-x-auto rounded-xl bg-[#f1f1ef] px-5 py-4 font-mono text-[13px] leading-[1.7] text-neutral-800 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)]">
      <code>{children}</code>
    </pre>
  );
}

function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[5px] bg-black/[0.05] px-[0.3em] py-[0.1em] font-mono text-[0.8em] text-neutral-800">
      {children}
    </code>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[5px] bg-white px-[0.4em] py-[0.1em] font-sans text-[0.75em] font-medium text-neutral-700 shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_1px_0_rgb(0_0_0/0.08)]">
      {children}
    </kbd>
  );
}

function Figure({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="my-10 sm:-mx-8">
      {children}
      <figcaption className="mt-2 px-1 font-sans text-[13px] leading-relaxed text-pretty text-neutral-500 sm:px-9">
        {caption}
      </figcaption>
    </figure>
  );
}

export default function Page() {
  return (
    <>
    <SiteHeader />
    <main className="mx-auto max-w-[640px] px-5 pt-14 pb-32 font-serif text-[19px] leading-[1.65] text-[#2a2a2a] sm:pt-28">
      <header className="mb-12">
        <p className="mb-4 font-sans text-[13px] font-medium text-neutral-500">A tiny React library</p>
        <h1 className="text-[40px] leading-[1.1] font-medium tracking-[-0.02em] text-balance text-neutral-900">
          Demos that move on their own, until you reach for them
        </h1>
      </header>

      <p>
        Most writing about interfaces shows its components as video. Video gets the timing right and everything else
        wrong: you can’t hover it, you can’t feel the spring, and it can’t answer the one question every reader has,
        which is <em>what happens if I do this instead?</em>
      </p>
      <p className="mt-6">
        The demos on this page are the real components, running in the page. A ghost cursor replays a recording of
        someone using them. The moment you move your own mouse into the box, it fades out and the component is yours.
      </p>

      <Figure
        caption={
          <>
            A sort menu. The ghost picks “Oldest”, then changes its mind to “A to Z”. Move into the box to take over;
            leave and it carries on. <Kbd>Space</Kbd> pauses while you’re pointing at the demo.
          </>
        }
      >
        <GhostCursor recording={sortRecording} className="h-[300px]">
          <SortMenu />
        </GhostCursor>
      </Figure>

      <h2 className="mt-14 mb-4 text-[24px] leading-tight font-medium tracking-[-0.01em] text-neutral-900">
        Real events, not a puppet
      </h2>
      <p>
        The ghost doesn’t animate the menu. It dispatches pointer events, the same <C>pointerover</C>,{" "}
        <C>pointerdown</C> and <C>click</C> a mouse would produce, at whatever sits under its tip. The highlight
        follows because the menu listens for <C>pointermove</C>. The list reorders because the click changed state.
        Nothing in the component knows it’s being replayed; the only concession is a <C>data-ghost-id</C> on the
        parts worth aiming at.
      </p>
      <Code>{usage}</Code>
      <p>
        Scripts can’t set <C>:hover</C>, so the ghost mirrors it as a <C>data-ghost-hover</C> attribute, and{" "}
        <C>:active</C> as <C>data-ghost-active</C>. On this site, Tailwind’s <C>hover:</C> and <C>active:</C> variants
        match both, so components are written exactly as they would be anyway.
      </p>

      <Figure
        caption={
          <>
            A segmented control and a switch driving a layout. The pill and the tiles are springs; the ghost only
            ever clicks. Try <Kbd>0.5×</Kbd> to watch the pill catch up.
          </>
        }
      >
        <GhostCursor recording={viewRecording} className="h-[320px]">
          <ViewSettings />
        </GhostCursor>
      </Figure>

      <h2 className="mt-14 mb-4 text-[24px] leading-tight font-medium tracking-[-0.01em] text-neutral-900">
        Getting out of the way
      </h2>
      <p>
        The handoff is the part that has to feel right. When you enter, the ghost lets go of whatever it was
        hovering, cancels a press if it was mid-click, and fades out where it stands. Whatever state it left behind
        is yours. Leave, and it fades back in and continues, unless you changed something. Then the component
        resets to its first frame and the take starts over, because a recording that clicks a menu item you’ve
        since closed is worse than no demo at all.
      </p>
      <p className="mt-6">
        The cursor’s path runs through a spring, so the drawn arrow trails the recording slightly. Rather than let a
        click land before the tip arrives, the playhead waits for it. Clicks always happen where you can see them.
      </p>
      <p className="mt-6">
        It stops when it’s scrolled away or the tab is hidden. With reduced motion turned on there’s no ghost at
        all. You get the first frame and a Play button.
      </p>

      <h2 className="mt-14 mb-4 text-[24px] leading-tight font-medium tracking-[-0.01em] text-neutral-900">
        Recording a take
      </h2>
      <p>
        In development, add <C>?record</C> to the URL. Every demo grows a recorder: press Record, use the component,
        press Stop, copy. Paste the result into a JSON file and import it. Coordinates are normalized to the box and
        targets are referenced by <C>data-ghost-id</C>, or by a CSS path when there isn’t one.
      </p>
      <Code>{excerpt(sortRecording)}</Code>
      <p>
        Box-relative coordinates break as soon as the layout reflows: a narrower column, a longer label. So every
        press also stores where inside its target it landed, and the replay bends the path between presses toward
        where those targets are now. Resize the window and the ghost still hits “A to Z”.
      </p>

      <p className="mt-10">
        To put one in your own writing, start with{" "}
        <Link href="/docs" className="underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-900">
          getting started
        </Link>
        .
      </p>

      <footer className="mt-20 border-t border-black/[0.07] pt-6 font-sans text-[13px] text-neutral-500">
        Built with Next.js, Motion and Tailwind. The recorder only loads in development.
      </footer>
    </main>
    </>
  );
}
