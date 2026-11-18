import type { Metadata } from "next";
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import { FilterList } from "@/components/demos/filter-list";
import { RecorderDemo } from "@/components/demos/recorder-demo";
import { A, C, Code, Figure, H1, H2, Lead, Next, P, Step } from "@/components/prose";
import filterList from "@/recordings/filter-list.json";
import recorderFlow from "@/recordings/recorder-flow.json";
import recorderPreview from "@/recordings/recorder-preview.json";

export const metadata: Metadata = { title: "Recording · ghost-cursor" };

const AGENT_STEPS = [`click @filter-input`, `type "to"`, `hover @option-toast`, `click @option-tooltip`];

export default function Recording() {
  return (
    <>
      <H1>Recording</H1>
      <Lead>
        A take is a JSON file. You can record one with your own hands in the browser, or describe it as a list of steps
        and let an agent record it with a script.
      </Lead>

      <H2 id="by-hand">By hand</H2>
      <P>
        Start your dev server and open the page with <C>?record</C> in the URL. The recorder replaces the player on
        every demo.
      </P>

      <Step n={1} title="Record a take">
        <P>
          Press Record. The component remounts, so the take starts from its first frame. Use it the way you want the
          reader to see it, then rest the pointer for a moment and press Stop. The move from the box to the Stop button
          is trimmed off the end.
        </P>
        <P>
          Time starts with your first event in the box, so the pause before you reach it costs nothing. Moves are
          sampled every 24ms.
        </P>
        <Figure caption="Record, one like, Stop. The counter shows events as the recorder receives them.">
          <GhostCursor recording={recorderFlow} className="h-[280px]">
            <RecorderDemo />
          </GhostCursor>
        </Figure>
      </Step>

      <Step n={2} title="Preview it, then save it">
        <P>
          Preview replays the take inside the recorder, so you can check it before keeping it. The Recorder button takes
          you back. When it looks right, press Copy recording and paste the JSON into a file next to your component.
        </P>
        <Code>{`
import recording from "./like-button.json";

<GhostCursor recording={recording}>
  <LikeButton />
</GhostCursor>`}</Code>
        <Figure caption="A second ghost appears inside the recorder. Preview is replaying the take the first ghost made.">
          <GhostCursor recording={recorderPreview} className="h-[280px]">
            <RecorderDemo />
          </GhostCursor>
        </Figure>
      </Step>

      <H2 id="with-an-agent">With an agent</H2>
      <P>
        The repository ships an agent skill in <C>skills/ghost-cursor</C>. Its script drives the same recorder with
        Playwright, moving like a hand: curved paths, varied speed, a small overshoot on long moves, and pauses before
        each press. Any agent that can run a command can use it.
      </P>

      <Step n={1} title="Name the targets">
        <P>
          The script aims at elements by <C>data-ghost-id</C>, so every element in the step list needs one. Below, the
          dashed outlines show the targets in a filter list.
        </P>
        <Code>{`
<input data-ghost-id="filter-input" />
<li data-ghost-id={\`option-\${slug(item)}\`}>{item}</li>`}</Code>
        <Figure caption="The take from step 2, with every data-ghost-id outlined.">
          <GhostCursor recording={filterList} className="show-targets h-[300px]">
            <FilterList />
          </GhostCursor>
        </Figure>
      </Step>

      <Step n={2} title="Run the script with a step list">
        <P>
          Each step is one argument: <C>hover</C>, <C>click</C>, <C>type</C>, <C>press</C> or <C>wait</C>. With the dev
          server running, the script opens the page with <C>?record</C>, performs the steps, writes the file, then
          reloads the page and checks that the replay ends in the same state the take did.
        </P>
        <Code>{`
npm run record -- \\
  --url http://localhost:3000/docs/recording \\
  --out apps/site/recordings/filter-list.json \\
${AGENT_STEPS.map((s) => `  '${s}'`).join(" \\\n")}`}</Code>
        <Figure
          caption={
            <>
              The recording those four steps produced. The typing goes through real <C>keydown</C> and <C>input</C>{" "}
              events, so the list filters itself.
            </>
          }
        >
          <GhostCursor recording={filterList} className="h-[300px]">
            <FilterList />
          </GhostCursor>
        </Figure>
        <P>
          The <A href="/docs/examples">examples</A> were all recorded this way, except the sort menu, which was
          recorded by hand.
        </P>
      </Step>

      <Next href="/docs/examples">Examples</Next>
    </>
  );
}
