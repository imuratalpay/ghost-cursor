import type { Metadata } from "next";
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import { neighbors } from "@/components/docs-pages";
import { FilterList } from "@/components/demos/filter-list";
import { RecorderDemo } from "@/components/demos/recorder-demo";
import { A, C, Code, Figure, H1, H2, P, PrevNext, Step } from "@/components/prose";
import filterListTake from "@/components/demos/filter-list.take.json";
import recorderFlow from "@/recordings/recorder-flow.json";
import recorderPreview from "@/recordings/recorder-preview.json";

export const metadata: Metadata = {
  title: "Recording",
  alternates: { types: { "text/markdown": "/docs/recording.md" } },
};


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
        With a coding agent you don’t have to record by hand. Install the ghost-record skill and describe the take in
        one sentence. The agent finds the component, records it with human-like input, checks the replay and prints the
        snippet.
      </P>
      <Code>{`/ghost-record filter list: type "to", then pick Tooltip`}</Code>
      <Figure caption="Recorded by ghost-record from that sentence. Every element it aimed at has a dashed outline.">
        <GhostCursor recording={filterListTake} className="show-targets h-[300px]">
          <FilterList />
        </GhostCursor>
      </Figure>
      <P>
        <A href="/docs/agent-skill">Agent skill</A> covers the install, what the script does, and its defaults.
      </P>

      <PrevNext {...neighbors("/docs/recording")} />
    </>
  );
}
