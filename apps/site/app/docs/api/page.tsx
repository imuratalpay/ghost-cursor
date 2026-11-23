import type { Metadata } from "next";
import { neighbors } from "@/components/docs-pages";
import { C, Code, H1, H2, Kbd, P, PrevNext, Table } from "@/components/prose";

export const metadata: Metadata = {
  title: "API",
  alternates: { canonical: "https://ghost-cursor.muratalpay.me/docs/api", types: { "text/markdown": "/docs/api.md" } },
};

const Req = () => <span className="text-fg-3"> required</span>;

export default function Api() {
  return (
    <>
      <H1>API</H1>
      <P>
        Three components and one JSON format. <C>{"<GhostCursor>"}</C> plays a recording, and records too when you
        open the page with <C>?record</C> in development. <C>{"<DevRecorder>"}</C> shows the record toolbar in
        development only. <C>{"<Recorder>"}</C> records in every environment.
      </P>

      <H2 id="ghost-cursor">GhostCursor</H2>
      <P>
        Use it for every demo you publish. You never need a second component to make a take. <C>GhostReplay</C> is
        the same component under another name; the agent skill’s snippets use it.
      </P>
      <Table
        head={["Prop", "Type", "Default", "Description"]}
        rows={[
          [
            <span key="p">
              <C>recording</C>
              <Req />
            </span>,
            <C key="t">Recording</C>,
            "",
            "The take to replay. Import it from the JSON file the recorder produced.",
          ],
          [
            <span key="p">
              <C>children</C>
              <Req />
            </span>,
            <C key="t">ReactNode</C>,
            "",
            "The component. It renders as usual and stays usable for the reader.",
          ],
          [
            <C key="p">className</C>,
            <C key="t">string</C>,
            "",
            "Classes for the box the ghost moves in. The box is at least 240px tall. Set its height here.",
          ],
          [<C key="p">style</C>, <C key="t">CSSProperties</C>, "", "Inline styles for the box."],
          [
            <C key="p">loopDelay</C>,
            <C key="t">number</C>,
            <span key="d" className="num">
              1600
            </span>,
            "How long the final state stays on screen before the take starts over, in ms. With loop={false}, how long it stays before the first frame and the Play button return. Infinity holds it.",
          ],
          [
            <C key="p">loop</C>,
            <C key="t">boolean</C>,
            <C key="d">true</C>,
            "Start the take over after loopDelay. When false, the take plays once.",
          ],
          [
            <C key="p">autoplay</C>,
            <C key="t">boolean</C>,
            <C key="d">true</C>,
            "Start playing on mount. When false, the first frame shows with a Play button.",
          ],
          [
            <C key="p">onEnd</C>,
            <C key="t">{"() => void"}</C>,
            "",
            "Called each time a run reaches its last frame: once per loop, or once with loop={false}. Not called when a seek lands on the end or a run is interrupted.",
          ],
          [
            <C key="p">ref</C>,
            <C key="t">{"Ref<GhostCursorHandle>"}</C>,
            "",
            "play(), togglePause() and seek(ms), the same controls as the play button and the scrubber.",
          ],
        ]}
      />
      <P>
        Reduced motion wins over <C>loop</C> and <C>autoplay</C>: the take never autoplays or loops. To play once and
        keep the final state on screen, turn the loop off and hold the end:
      </P>
      <Code>{`
<GhostCursor recording={recording} loop={false} loopDelay={Infinity} onEnd={() => setDone(true)}>
  <SortMenu />
</GhostCursor>`}</Code>

      <H2 id="dev-recorder">DevRecorder</H2>
      <P>
        The record toolbar around <C>children</C> in <C>next dev</C>, and <C>children</C> alone in a production build,
        so you don’t need a <C>NODE_ENV</C> check. It takes the same props as <C>{"<Recorder>"}</C>.
      </P>
      <Code>{`
import { DevRecorder } from "@imuratalpay/ghost-cursor";

<DevRecorder style={{ height: 320 }}>
  <LikeButton />
</DevRecorder>`}</Code>

      <H2 id="recorder">Recorder</H2>
      <P>
        Use it when recording has to work outside development, for example on an authoring page or in a demo of the
        recorder itself. For published demos, use <C>{"<GhostCursor>"}</C>.
      </P>
      <Table
        head={["Prop", "Type", "Default", "Description"]}
        rows={[
          [
            <span key="p">
              <C>children</C>
              <Req />
            </span>,
            <C key="t">ReactNode</C>,
            "",
            "The component to record.",
          ],
          [<C key="p">className</C>, <C key="t">string</C>, "", "Classes for the box."],
          [<C key="p">style</C>, <C key="t">CSSProperties</C>, "", "Inline styles for the box."],
          [
            <C key="p">onRecord</C>,
            <C key="t">{"(recording) => void"}</C>,
            "",
            "Called when Stop ends a take that has at least one event.",
          ],
          [
            <C key="p">captureSynthetic</C>,
            <C key="t">boolean</C>,
            <C key="d">false</C>,
            "Also record events that scripts dispatch. Turn it on only when a GhostCursor replays a demo of the recorder.",
          ],
        ]}
      />

      <H2 id="attributes">Attributes</H2>
      <P>
        You set <C>data-ghost-id</C>. The ghost sets the other three on the elements it touches and removes them when it
        moves on, because a script can’t switch on the real CSS states.
      </P>
      <Table
        head={["Attribute", "Set by", "Meaning"]}
        rows={[
          [
            <C key="a">data-ghost-id</C>,
            "You",
            "A name for the recorder to use instead of a CSS path. Put one on every element a take clicks or types into.",
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
      <P>With Tailwind CSS v4, override the variants in your stylesheet and your components need no changes.</P>
      <Code title="app/globals.css">{`
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

      <H2 id="theming">Colors</H2>
      <P>
        Every color in the stylesheet is a variable on <C>.gc-root</C>, and the defaults are a light theme. Map them to
        your own tokens to follow your color scheme.
      </P>
      <Code>{`
.gc-root {
  --gc-fg: var(--fg-1);        /* buttons and icons */
  --gc-muted: var(--fg-3);     /* time, hints */
  --gc-stage: var(--stage);    /* the box */
  --gc-surface: var(--surface);
  --gc-line: var(--line);
}`}</Code>

      <H2 id="behavior">Behavior</H2>
      <Table
        head={["When", "The player"]}
        rows={[
          ["The reader’s mouse enters the box", "Fades the ghost out and stops the playhead. The component is the reader’s."],
          ["The reader leaves without clicking or typing", "Fades the ghost back in after 420ms and continues from where it stopped."],
          ["The reader leaves after clicking or typing", "Remounts the component to its first frame and starts the take over."],
          ["The reader tabs into the box", "Steps aside the same way, until focus leaves the box."],
          ["The box scrolls out of view, or the tab is hidden", "Pauses."],
          ["The reader prefers reduced motion", "Doesn’t autoplay or loop. It shows the first frame and a Play button that runs the take once."],
          [
            "The take ends",
            "Calls onEnd and holds the final state for loopDelay. If the DOM changed, it cross-fades back to the first frame, then starts over. With loop={false}, it returns to the first frame and a Play button instead, or holds the final state with a Play button if loopDelay is Infinity.",
          ],
          ["Play is pressed at the end", "Starts the take over from the first frame."],
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
            <span key="k">
              <Kbd>←</Kbd> <Kbd>→</Kbd>
            </span>,
            "Scrubber",
            "Seek 250ms, or 1s with Shift",
          ],
          [
            <span key="k">
              <Kbd>Home</Kbd> <Kbd>End</Kbd>
            </span>,
            "Scrubber",
            "Jump to the start or the end",
          ],
        ]}
      />
      <P>Inside the box, every key goes to the component.</P>

      <H2 id="format">Recording format</H2>
      <P>
        One JSON object per take. Coordinates run from 0 to 1 across the box. Each press also stores where it landed
        inside its target, so a take recorded at one width still hits its targets at another.
      </P>
      <Code>{`
type Recording = {
  v: 1;
  size: [width: number, height: number]; // box size while recording, in px
  targets: string[];                     // "@name", or a CSS path from the content root
  events: (
    | [t: number, "m", x: number, y: number]                         // move
    | [t: number, "d" | "u" | "c", x: number, y: number,
       target?: number, offsetX?: number, offsetY?: number]          // down, up, click
    | [t: number, "k", key: string, target?: number, mods?: number]  // key press
  )[];
};`}</Code>

      <H2 id="limits">Limits</H2>
      <P>
        The ghost dispatches events. It isn’t a browser. A component that calls <C>setPointerCapture</C> during a replay
        throws, because the synthetic pointer isn’t active. Recorded Tab presses don’t move focus. Enter and Space
        activate buttons and checkboxes the way a browser would, and typing works in text inputs and textareas.
      </P>

      <PrevNext {...neighbors("/docs/api")} />
    </>
  );
}
