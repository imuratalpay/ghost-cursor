# @psychedelichip/ghost-cursor

Live, replayable component demos for writing about interfaces. A ghost cursor replays a recording over your real component and dispatches real DOM events, so the component reacts as it would to a mouse. When the reader moves into the box, the ghost fades out and the component is theirs.

## Install

```bash
npm i @psychedelichip/ghost-cursor motion
```

React 18 or later and Motion are peer dependencies. Load the stylesheet once:

```css
/* With Tailwind CSS v4, in the components layer so your classes win */
@import "@psychedelichip/ghost-cursor/styles.css" layer(components);
```

```ts
// Without Tailwind, in your root layout
import "@psychedelichip/ghost-cursor/styles.css";
```

## Example

```tsx
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import recording from "./sort-menu.json";

export function SortMenuDemo() {
  return (
    <GhostCursor recording={recording} className="h-[300px]">
      <SortMenu />
    </GhostCursor>
  );
}
```

Put `data-ghost-id` on the elements the cursor clicks, so recordings refer to them by name.

## Record a take

1. Run your dev server and open the page with `?record` in the URL.
2. Press Record, use the component, press Stop.
3. Press Copy recording and paste the JSON into the file you import.

`<Recorder>` gives you the same controls in any environment, including production. With a coding agent, the `ghost-record` skill in this repository records and checks a take from one sentence.

## Hover and press states

A script can't switch on `:hover`, `:active` or `:focus`, so the ghost mirrors them as `data-ghost-hover`, `data-ghost-active` and `data-ghost-focus`. Style them next to the real states:

```css
.item:hover,
.item[data-ghost-hover] {
  background: #f5f5f5;
}
```

## API

| Export | What it is |
| --- | --- |
| `GhostCursor`, `GhostReplay` | The same component under two names. Plays a recording. Props: `recording`, `children`, `className`, `style`, `loopDelay` (ms, default 1600). With `?record` in development, it records instead. |
| `Recorder` | Records in every environment. Props: `children`, `className`, `style`, `onRecord(recording)`, `captureSynthetic`. |
| `Recording`, `RecordingInput` | The JSON format and the looser type a JSON import infers. |

Playback pauses offscreen and in hidden tabs. With reduced motion, the first frame shows with a Play button instead of autoplay. Space pauses while the pointer is over the demo; the scrubber seeks with the mouse or the arrow keys.

## License

MIT
