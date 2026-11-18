import type { Metadata } from "next";
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import { CopyCommand } from "@/components/demos/copy-command";
import { RecorderDemo } from "@/components/demos/recorder-demo";
import { SortMenu } from "@/components/demos/sort-menu";
import { A, C, Code, Figure, H1, Kbd, Lead, Next, P, Step } from "@/components/prose";
import copyCommand from "@/recordings/copy-command.json";
import recorderFlow from "@/recordings/recorder-flow.json";
import sortMenu from "@/recordings/sort-menu.json";

export const metadata: Metadata = { title: "Getting started · ghost-cursor" };

const INSTALL = "npm i @psychedelichip/ghost-cursor motion";

export default function GettingStarted() {
  return (
    <>
      <H1>Getting started</H1>
      <Lead>
        ghost-cursor replays a recording of someone using your component, in the page, with real DOM events. A reader
        can take over at any moment by moving their own mouse into the box. Three steps get you from install to your
        first recording.
      </Lead>

      <Step n={1} title="Install the package">
        <P>
          Install it with Motion, which drives the cursor’s spring. React 18 or later is required.
        </P>
        <Code>{INSTALL}</Code>
        <P>
          Then load the stylesheet once. With Tailwind CSS v4, import it into the components layer so classes you pass
          to the stage override its defaults:
        </P>
        <Code>{`
/* app/globals.css */
@import "tailwindcss";
@import "@psychedelichip/ghost-cursor/styles.css" layer(components);`}</Code>
        <P>
          Without Tailwind, import <C>@psychedelichip/ghost-cursor/styles.css</C> from your root layout.
        </P>
        <Figure
          caption={
            <>
              The ghost copies the install command. Move into the box and the copy button is yours to press.
            </>
          }
        >
          <GhostCursor recording={copyCommand} className="h-[200px] min-h-0">
            <CopyCommand command={INSTALL} />
          </GhostCursor>
        </Figure>
      </Step>

      <Step n={2} title="Wrap a component">
        <P>
          Put the component inside <C>{"<GhostCursor>"}</C> and give the stage a height. Add <C>data-ghost-id</C> to
          every element the cursor clicks. The recording refers to elements by that name, so it keeps working when the
          markup around them changes.
        </P>
        <Code>{`
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import recording from "./sort-menu.json";

export function Demo() {
  return (
    <GhostCursor recording={recording} className="h-[300px]">
      <SortMenu />
    </GhostCursor>
  );
}

// inside SortMenu
<button data-ghost-id="sort-trigger">Sort</button>`}</Code>
        <P>
          Scripts can’t trigger <C>:hover</C>, so the ghost sets <C>data-ghost-hover</C> on whatever it points at, and{" "}
          <C>data-ghost-active</C> while it presses. Style both next to the real states:
        </P>
        <Code>{`
.menu-item:hover,
.menu-item[data-ghost-hover] {
  background: #f5f5f5;
}`}</Code>
        <P>
          With Tailwind, override the variants once and keep writing <C>hover:</C> as usual. The{" "}
          <A href="/docs/api#attributes">API page</A> has the full snippet.
        </P>
        <Figure
          caption={
            <>
              The wrapped menu, replaying. The highlight follows the ghost because the menu listens for{" "}
              <C>pointermove</C>. <Kbd>Space</Kbd> pauses while you point at the controls.
            </>
          }
        >
          <GhostCursor recording={sortMenu} className="h-[300px]">
            <SortMenu />
          </GhostCursor>
        </Figure>
      </Step>

      <Step n={3} title="Record a take">
        <P>
          Run your dev server and open the page with <C>?record</C> at the end of the URL. Every{" "}
          <C>{"<GhostCursor>"}</C> on the page becomes a recorder. Press Record, use the component, then press Stop.
          Copy recording puts the JSON on your clipboard; paste it into the file you import.
        </P>
        <Code>{`http://localhost:3000/my-post?record`}</Code>
        <P>
          The recorder only exists in development builds. In production, <C>?record</C> does nothing.
        </P>
        <Figure
          caption={
            <>
              The real recorder, replaying a take of itself: Record, a like, Stop, Copy recording. The event count
              comes from the ghost’s own events.
            </>
          }
        >
          <GhostCursor recording={recorderFlow} className="h-[280px]">
            <RecorderDemo />
          </GhostCursor>
        </Figure>
      </Step>

      <Next href="/docs/api">API reference</Next>
    </>
  );
}
