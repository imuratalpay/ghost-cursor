import { GhostCursor } from "@psychedelichip/ghost-cursor";
import { SortMenu } from "@/components/demos/sort-menu";
import { InstallCommand } from "@/components/install-command";
import { A, C, Code, Figure, H2, P, Step } from "@/components/prose";
import { SiteHeader } from "@/components/site-header";
import sortMenu from "@/recordings/sort-menu.json";

const INSTALL = `
npm i @psychedelichip/ghost-cursor

/* app/globals.css */
@import "tailwindcss";
@import "@psychedelichip/ghost-cursor/styles.css" layer(components);`;

const WRAP = `
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import take from "./sort-menu.json";
<GhostCursor recording={take} className="h-[320px]">
  <SortMenu />
</GhostCursor>`;

const RECORD = `
npm run dev
# open http://localhost:3000/your-post?record
# press Record, then use the component
# press Stop, then Copy recording
# paste the JSON into sort-menu.json`;

export default function Home() {
  return (
    <div className="mx-auto max-w-[684px] px-5 pb-24">
      <SiteHeader />
      <main>
        <h1 className="mt-16 text-[48px] leading-[48px] font-display tracking-[-0.022em] sm:mt-24">
          A cursor that demos your component, then gets out of the way.
        </h1>

        <div className="mt-12">
        <Figure
          caption={
            <>
              The real menu, replaying a take I recorded by hand. Move into the box and it’s yours. Leave, and the
              ghost carries on.
            </>
          }
        >
          <GhostCursor recording={sortMenu} className="h-[340px]">
            <SortMenu />
          </GhostCursor>
        </Figure>
        </div>

        <InstallCommand command="npm i @psychedelichip/ghost-cursor" />

        <H2>Three steps</H2>
        <P>
          ghost-cursor dispatches real pointer and keyboard events, so nothing inside your component knows it’s being
          replayed.
        </P>

        <Step n={1} title="Install">
          <P>npm installs Motion alongside it as a peer dependency. Motion drives the cursor’s spring.</P>
          <Code>{INSTALL}</Code>
        </Step>

        <Step n={2} title="Wrap">
          <P>
            Give the box a height, and put <C>data-ghost-id</C> on every element the cursor clicks. The recording finds
            elements by that name, so it keeps working when the markup around them changes.
          </P>
          <Code>{WRAP}</Code>
        </Step>

        <Step n={3} title="Record">
          <P>
            In development, <C>?record</C> turns every demo on the page into a recorder.
          </P>
          <Code>{RECORD}</Code>
        </Step>

        <p className="mt-12">
          The <A href="/docs">docs</A> cover recording with an agent, every prop, and four more examples.
        </p>
      </main>
    </div>
  );
}
