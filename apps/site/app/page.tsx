import type { Metadata } from "next";
import { Suspense } from "react";
import { GhostReplay } from "@imuratalpay/ghost-cursor";
import { SortMenu } from "@/components/demos/sort-menu";
import { InstallCommand } from "@/components/install-command";
import { A, C, Code, Figure, H2, P, Step } from "@/components/prose";
import { SiteFooter } from "@/components/site-footer";
import { TellAgent } from "@/components/tell-agent";
import sortMenu from "@/recordings/sort-menu.json";

export const metadata: Metadata = {
  alternates: { canonical: "https://ghost-cursor.muratalpay.me", types: { "text/markdown": "/docs.md" } },
};

const SENTENCE = "Read https://ghost-cursor.muratalpay.me/docs and record this component’s interaction.";

const INSTALL = `
/* app/globals.css */
@import "tailwindcss";
@import "@imuratalpay/ghost-cursor/styles.css" layer(components);`;

const WRAP = `
import { GhostReplay } from "@imuratalpay/ghost-cursor";
import take from "./sort-menu.json";
<GhostReplay recording={take} style={{ height: 320 }}>
  <SortMenu />
</GhostReplay>`;

const RECORD = `
npm run dev
# open http://localhost:3000/your-post?record
# press Record, then use the component
# press Stop, then Copy recording
# paste the JSON into sort-menu.json`;

export default function Home() {
  return (
    <div className="mx-auto max-w-[684px] px-5 pb-24">
      <main id="content">
        <h1 className="mt-16 text-[48px] leading-[48px] font-display tracking-[-0.022em] sm:mt-24">
          A cursor that demos your component, then gets out of the way.
        </h1>

        <div className="mt-12">
          <Figure caption="The real menu, replaying a take I recorded by hand. Move into the box and it’s yours. Leave, and the ghost carries on.">
            <GhostReplay recording={sortMenu} className="h-[340px]">
              <SortMenu />
            </GhostReplay>
          </Figure>
        </div>

        <section className="mt-12" aria-labelledby="tell-agent">
          <div id="tell-agent" className="label mb-2">
            Tell your agent
          </div>
          <TellAgent sentence={SENTENCE} />
          <p className="mt-3">
            Name the component and what it should do, or ask it to open the record toolbar instead. The agent reads the
            steps from <A href="/docs/agents">the docs for agents</A>, records a take, checks that it replays, and gives
            you the snippet.
          </p>
        </section>

        <H2>Or do it yourself</H2>
        <P>
          ghost-cursor dispatches real pointer and keyboard events, so nothing inside your component knows it’s being
          replayed.
        </P>

        <Step n={1} title="Install">
          <P>npm installs Motion alongside it as a peer dependency. Motion drives the cursor’s spring.</P>
          <InstallCommand command="npm i @imuratalpay/ghost-cursor" />
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
          The <A href="/docs">docs</A> cover recording, the agent skill, every prop, and four more examples.
        </p>
      </main>
      <Suspense>
        <SiteFooter />
      </Suspense>
    </div>
  );
}
