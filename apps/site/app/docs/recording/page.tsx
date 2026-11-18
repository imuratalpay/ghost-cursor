import type { Metadata } from "next";
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import { neighbors } from "@/components/docs-pages";
import { FilterList } from "@/components/demos/filter-list";
import { RecorderDemo } from "@/components/demos/recorder-demo";
import { A, C, Code, Figure, H1, H2, P, PrevNext, Step } from "@/components/prose";
import filterList from "@/recordings/filter-list.json";
import recorderFlow from "@/recordings/recorder-flow.json";
import recorderPreview from "@/recordings/recorder-preview.json";

export const metadata: Metadata = { title: "Recording" };

const AGENT_STEPS = [`click @filter-input`, `type "to"`, `hover @option-toast`, `click @option-tooltip`];

export default function Recording() {
  return (
    <>
      <H1>Recording</H1>
      <P>
        A take is a JSON file. You can record one by hand in the browser, or write the take as a list of steps and let
        an agent record it with a script.
      </P>

      <H2 id="by-hand">By hand</H2>
      <P>
        Start your dev server and open the page with <C>?record</C> in the URL. Every demo on the page turns into a
        recorder.
      </P>

      <Step n={1} title="Record a take">
        <P>
          Press Record. The component remounts, so the take starts from its first frame. Use it the way you want the
          reader to see it, rest the pointer for a moment, then press Stop. The recorder trims the move from the box to
          the Stop button off the end.
        </P>
        <P>
          Time starts with your first event inside the box, so the pause before you get there doesn’t end up in the
          take. Pointer moves are sampled every 24ms.
        </P>
        <Figure caption="Record, one like, Stop. The counter goes up as the recorder receives events.">
          <GhostCursor recording={recorderFlow} className="h-[280px]">
            <RecorderDemo />
          </GhostCursor>
        </Figure>
      </Step>

      <Step n={2} title="Preview it, then save it">
        <P>
          Preview replays the take inside the recorder, so you can watch it before you keep it. The Recorder button
          takes you back. When it looks right, press Copy recording and paste the JSON into a file next to your
          component.
        </P>
        <Code>{`
import recording from "./like-button.json";

<GhostCursor recording={recording}>
  <LikeButton />
</GhostCursor>`}</Code>
        <Figure caption="After Preview, a second ghost appears inside the recorder and replays the take the first one made.">
          <GhostCursor recording={recorderPreview} className="h-[280px]">
            <RecorderDemo />
          </GhostCursor>
        </Figure>
      </Step>

      <H2 id="with-an-agent">With an agent</H2>
      <P>
        The repository ships an agent skill in <C>skills/ghost-cursor</C>. Its script drives the same recorder through
        Playwright and moves like a hand. Paths curve, speed changes from move to move, long moves overshoot by a few
        pixels and correct, and every press has a pause before it. Any agent that can run a command can use it.
      </P>

      <Step n={1} title="Name the targets">
        <P>
          The script aims at elements by <C>data-ghost-id</C>, so every element in the step list needs one. In the demo
          below, each target has a dashed outline.
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
          Each step is one argument: <C>hover</C>, <C>click</C>, <C>type</C>, <C>press</C>, <C>wait</C> or{" "}
          <C>move</C>. With the dev server running, the script opens the page with <C>?record</C>, performs the steps
          and writes the file. Then it reloads the page and checks that the replay ends in the same state as the take.
        </P>
        <Code>{`
npm run record -- \\
  --url http://localhost:3000/docs/recording \\
  --out apps/site/recordings/filter-list.json \\
${AGENT_STEPS.map((s) => `  '${s}'`).join(" \\\n")}`}</Code>
        <Code title="Output">{`
✓ recorded 4 steps → apps/site/recordings/filter-list.json  (60 events, 2 presses, 4.0s, 1.6 KB)
  targets: @filter-input, @option-tooltip
✓ replay reached the end and matches the take's final state`}</Code>
        <Figure
          caption={
            <>
              What those four steps produced. The typing goes through real <C>keydown</C> and <C>input</C> events, so
              the list filters itself.
            </>
          }
        >
          <GhostCursor recording={filterList} className="h-[300px]">
            <FilterList />
          </GhostCursor>
        </Figure>
        <P>
          Every demo on this site was recorded this way except the sort menu, which I recorded by hand. The{" "}
          <A href="/docs/examples">examples</A> show four of them.
        </P>
      </Step>

      <PrevNext {...neighbors("/docs/recording")} />
    </>
  );
}
