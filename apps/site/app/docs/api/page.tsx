import type { Metadata } from "next";
import { C, Code, H1, H2, Kbd, Lead, Next, P, Table } from "@/components/prose";

export const metadata: Metadata = { title: "API · ghost-cursor" };

const Req = () => <span className="ml-1.5 text-[12px] text-neutral-400">required</span>;

export default function Api() {
  return (
    <>
      <H1>API reference</H1>
      <Lead>
        Two components and a JSON format. <C>{"<GhostCursor>"}</C> plays a recording, and in development it also
        records. <C>{"<Recorder>"}</C> records in every environment.
      </Lead>

      <H2 id="ghost-cursor">GhostCursor</H2>
      <P>
        Use it for every published demo. In development, adding <C>?record</C> to the URL swaps the player for a
        recorder, so you never need a second component to make a take.
      </P>
      <Table
        head={["Prop", "Type", "Default", "Description"]}
        rows={[
          [
            <span key="c">
              <C>recording</C>
              <Req />
            </span>,
            <C key="t">Recording</C>,
            "",
            "The take to replay. Import it from the JSON file the recorder produced.",
          ],
          [
            <span key="c">
              <C>children</C>
              <Req />
            </span>,
            <C key="t">ReactNode</C>,
            "",
            "The component. It renders as usual and stays interactive for the reader.",
          ],
          [
            <C key="c">className</C>,
            <C key="t">string</C>,
            "",
            "Classes for the stage, the box the ghost moves in. The stage is at least 240px tall; set the height here.",
          ],
          [<C key="c">style</C>, <C key="t">CSSProperties</C>, "", "Inline styles for the stage."],
          [
            <C key="c">loopDelay</C>,
            <C key="t">number</C>,
            <C key="d">1600</C>,
            "Milliseconds the final state stays on screen before the take starts over.",
          ],
        ]}
      />

      <H2 id="recorder">Recorder</H2>
      <P>
        Use it when recording has to work outside development: an authoring page, a playground, or a demo of the
        recorder itself. For published demos, use <C>{"<GhostCursor>"}</C>.
      </P>
      <Table
        head={["Prop", "Type", "Default", "Description"]}
        rows={[
          [
            <span key="c">
              <C>children</C>
              <Req />
            </span>,
            <C key="t">ReactNode</C>,
            "",
            "The component to record.",
          ],
          [<C key="c">className</C>, <C key="t">string</C>, "", "Classes for the stage."],
          [<C key="c">style</C>, <C key="t">CSSProperties</C>, "", "Inline styles for the stage."],
          [
            <C key="c">onRecord</C>,
            <C key="t">{"(recording: Recording) => void"}</C>,
            "",
            "Called when Stop ends a take that has at least one event.",
          ],
          [
            <C key="c">captureSynthetic</C>,
            <C key="t">boolean</C>,
            <C key="d">false</C>,
            "Also record events dispatched by scripts. Turn it on only when a GhostCursor replays a demo of the recorder.",
          ],
        ]}
      />

      <H2 id="attributes">Attributes</H2>
      <P>
        You set <C>data-ghost-id</C>. The ghost sets the other three on the elements it touches and removes them when it
        leaves, because a script can’t switch on the real CSS states.
      </P>
      <Table
        head={["Attribute", "Set by", "Meaning"]}
        rows={[
          [
            <C key="a">data-ghost-id</C>,
            "You",
            "Names an element for the recorder. Recordings store “@name” instead of a CSS path. Use one on every element a take clicks or types into.",
          ],
          [<C key="a">data-ghost-hover</C>, "Ghost", "Mirrors :hover on the element under the ghost and its ancestors."],
          [<C key="a">data-ghost-active</C>, "Ghost", "Mirrors :active while the ghost holds a press."],
          [
            <C key="a">data-ghost-focus</C>,
            "Ghost",
            "Marks the element a real press would have focused. Real focus never moves during a replay.",
          ],
        ]}
      />
      <P>With Tailwind CSS v4, override the variants in your stylesheet so components need no changes:</P>
      <Code>{`
@custom-variant hover {
  @media (hover: hover) and (pointer: fine) {
    &:hover { @slot; }
  }
  &[data-ghost-hover] { @slot; }
}

@custom-variant active {
  &:active { @slot; }
  &[data-ghost-active] { @slot; }
}

@custom-variant focus {
  &:focus { @slot; }
  &[data-ghost-focus] { @slot; }
}`}</Code>

      <H2 id="behavior">Behavior</H2>
      <Table
        head={["When", "What the player does"]}
        rows={[
          ["The reader’s mouse enters the stage", "The ghost fades out and the playhead stops. The component is the reader’s."],
          [
            "The reader leaves without clicking or typing",
            "After 420ms the ghost fades back in and the take continues from where it stopped.",
          ],
          [
            "The reader leaves after clicking or typing",
            "The component remounts to its first frame and the take starts over.",
          ],
          ["The reader tabs into the stage", "Same as the mouse. The ghost steps aside until focus leaves the stage."],
          ["The stage scrolls out of view or the tab is hidden", "Playback pauses."],
          ["The reader prefers reduced motion", "No autoplay. The first frame shows with a Play button that runs the take once."],
          [
            "The take ends",
            "The final state holds for loopDelay. If the DOM changed, the component cross-fades back to its first frame.",
          ],
        ]}
      />
      <P>
        Clicks wait for the cursor. The drawn arrow trails the recorded path because it runs through a spring, so the
        playhead holds each press until the tip is within 3px of its target.
      </P>

      <H2 id="keyboard">Keyboard</H2>
      <Table
        head={["Key", "Where", "Action"]}
        rows={[
          [<Kbd key="k">Space</Kbd>, "Pointer over the demo, or focus in its controls", "Pause or resume"],
          [
            <span key="k" className="whitespace-nowrap">
              <Kbd>←</Kbd> <Kbd>→</Kbd>
            </span>,
            "Scrubber",
            "Seek 250ms. Hold Shift for 1s.",
          ],
          [
            <span key="k" className="whitespace-nowrap">
              <Kbd>Home</Kbd> <Kbd>End</Kbd>
            </span>,
            "Scrubber",
            "Jump to the start or the end",
          ],
        ]}
      />
      <P>Inside the stage, every key goes to the component.</P>

      <H2 id="format">Recording format</H2>
      <P>
        One JSON object per take. Coordinates are 0 to 1 across the stage. Presses also store where they landed inside
        their target, so a take recorded at one width still hits its targets at another.
      </P>
      <Code>{`
type Recording = {
  v: 1;
  size: [width: number, height: number]; // stage size while recording, in px
  targets: string[];                     // "@name" or a CSS path from the content root
  events: (
    | [t: number, "m", x: number, y: number]                           // move
    | [t: number, "d" | "u" | "c", x: number, y: number,
       target?: number, offsetX?: number, offsetY?: number]            // down, up, click
    | [t: number, "k", key: string, target?: number, mods?: number]    // key press
  )[];
};`}</Code>

      <H2 id="limits">Limits</H2>
      <P>
        The ghost dispatches events; it isn’t a browser. A component that calls <C>setPointerCapture</C> during a
        replay throws, because the synthetic pointer isn’t active. Recorded Tab presses don’t move focus. Enter and
        Space activate buttons and checkboxes the way a browser would, and typing works in text inputs and textareas.
      </P>

      <Next href="/docs/recording">Recording</Next>
    </>
  );
}
