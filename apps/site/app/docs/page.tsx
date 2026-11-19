import type { Metadata } from "next";
import { GhostCursor } from "@imuratalpay/ghost-cursor";
import { neighbors } from "@/components/docs-pages";
import { CopyCommand } from "@/components/demos/copy-command";
import { RecorderDemo } from "@/components/demos/recorder-demo";
import { SortMenu } from "@/components/demos/sort-menu";
import { A, C, Code, Figure, H1, Kbd, P, PrevNext, Step } from "@/components/prose";
import copyCommand from "@/recordings/copy-command.json";
import recorderFlow from "@/recordings/recorder-flow.json";
import sortMenu from "@/recordings/sort-menu.json";

export const metadata: Metadata = {
  title: "Getting started",
  alternates: { types: { "text/markdown": "/docs.md" } },
};

const INSTALL = "npm i @imuratalpay/ghost-cursor";

export default function GettingStarted() {
  return (
    <>
      <H1>Getting started</H1>
      <P>
        ghost-cursor plays back a recording of someone using your component, in the page, with real DOM events. The
        component doesn’t know it’s being replayed. When a reader moves into the box, the ghost fades out and the
        component is <em>theirs</em>.
      </P>
      <P>
        Three steps get you from install to your first take. If you’re an agent, read{" "}
        <A href="/docs/agents">For agents</A> or <a className="link" href="/llms.txt">/llms.txt</a> instead: it has
        the exact steps for recording a take and for mounting the record toolbar.
      </P>

      <Step n={1} title="Install the package">
        <P>
          npm installs Motion alongside it as a peer dependency. Motion drives the cursor’s spring. You need React 18
          or later.
        </P>
        <Code>{INSTALL}</Code>
        <P>
          Then load the stylesheet once. With Tailwind CSS v4, import it into the components layer, so classes you pass
          to the box override its defaults.
        </P>
        <Code title="app/globals.css">{`
@import "tailwindcss";
@import "@imuratalpay/ghost-cursor/styles.css" layer(components);`}</Code>
        <P>
          Without Tailwind, import <C>@imuratalpay/ghost-cursor/styles.css</C> in your root layout.
        </P>
        <Figure caption="The ghost copies the install command. Move into the box to press the button yourself.">
          <GhostCursor recording={copyCommand} className="h-[200px] min-h-0">
            <CopyCommand command={INSTALL} />
          </GhostCursor>
        </Figure>
      </Step>

      <Step n={2} title="Wrap a component">
        <P>
          Put the component inside <C>{"<GhostCursor>"}</C> and give the box a height. Add <C>data-ghost-id</C> to
          every element the cursor clicks. The recording finds elements by that name, so it keeps working when the
          markup around them changes.
        </P>
        <Code>{`
import { GhostCursor } from "@imuratalpay/ghost-cursor";
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
          A script can’t switch on <C>:hover</C>, so the ghost sets <C>data-ghost-hover</C> on whatever it points at
          and <C>data-ghost-active</C> while it presses. Style both next to the real states.
        </P>
        <Code>{`
.menu-item:hover,
.menu-item[data-ghost-hover] {
  background: #f4f4f4;
}`}</Code>
        <P>
          With Tailwind, override the variants once and keep writing <C>hover:</C>. The{" "}
          <A href="/docs/api#attributes">API page</A> has the snippet.
        </P>
        <Figure
          caption={
            <>
              The wrapped menu. The highlight follows the ghost because the menu listens for <C>pointermove</C>.{" "}
              <Kbd>Space</Kbd> pauses while you point at the controls.
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
          Copy recording puts the JSON on your clipboard. Paste it into the file you import.
        </P>
        <P>
          The recorder only exists in development builds. In production, <C>?record</C> does nothing.
        </P>
        <Figure caption="The real recorder, replaying a take of itself. The ghost presses Record, likes, presses Stop, then copies. The event count comes from the ghost’s own events.">
          <GhostCursor recording={recorderFlow} className="h-[280px]">
            <RecorderDemo />
          </GhostCursor>
        </Figure>
      </Step>

      <PrevNext {...neighbors("/docs")} />
    </>
  );
}
