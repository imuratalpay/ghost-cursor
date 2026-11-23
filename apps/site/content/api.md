# API

Three components and one JSON format, all from `@imuratalpay/ghost-cursor`.

## GhostReplay (also GhostCursor)

Plays a recording. In development, `?record` in the URL turns it into a recorder.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `recording` (required) | `Recording` | | The take to replay, imported from its JSON file. |
| `children` (required) | `ReactNode` | | The component. It renders as usual and stays usable. |
| `className` | `string` | | Classes for the box. The box is at least 240px tall. |
| `style` | `CSSProperties` | | Inline styles for the box, such as `{ height: 320 }`. |
| `loopDelay` | `number` | `1600` | How long the final state stays before the take restarts, in ms. With `loop={false}`, how long it stays before the first frame and the Play button return. `Infinity` holds it. |
| `loop` | `boolean` | `true` | Start the take over after `loopDelay`. When false, the take plays once. |
| `autoplay` | `boolean` | `true` | Start playing on mount. When false, the first frame shows with a Play button. |
| `onEnd` | `() => void` | | Called each time a run reaches its last frame: once per loop, or once with `loop={false}`. Not called when a seek lands on the end or a run is interrupted. |
| `ref` | `Ref<GhostCursorHandle>` | | `play()`, `togglePause()` and `seek(ms)`, the same controls as the play button and the scrubber. |

Reduced motion wins over `loop` and `autoplay`: the take never autoplays or loops.

To play once and keep the final state on screen:

```tsx
<GhostReplay recording={take} loop={false} loopDelay={Infinity} onEnd={() => setDone(true)}>
  <SortMenu />
</GhostReplay>
```

## DevRecorder

The record toolbar around `children` in development; `children` alone in production. Same props as `Recorder`.

## Recorder

Records in every environment, production included.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` | | The component to record. |
| `className`, `style` | | | The box. |
| `onRecord` | `(recording) => void` | | Called when Stop ends a take with at least one event. |
| `captureSynthetic` | `boolean` | `false` | Also record script-dispatched events. Only for demos of the recorder itself. |

## Attributes

| Attribute | Set by | Meaning |
| --- | --- | --- |
| `data-ghost-id` | you | A name the recorder uses instead of a CSS path. |
| `data-ghost-hover` | ghost | Mirrors `:hover` on the element under the ghost and its ancestors. |
| `data-ghost-active` | ghost | Mirrors `:active` while the ghost presses. |
| `data-ghost-focus` | ghost | Marks the element a real press would have focused. Real focus never moves. |

With Tailwind CSS v4, override the variants once:

```css
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
```

## Colors

Every color in the stylesheet is a variable on `.gc-root`; the defaults are a light theme. Map `--gc-fg`, `--gc-muted`, `--gc-stage`, `--gc-surface` and `--gc-line` to your tokens.

## Behavior

| When | The player |
| --- | --- |
| The reader's mouse enters the box | Fades the ghost out and stops the playhead. |
| The reader leaves without clicking or typing | Fades the ghost back in after 420ms and continues. |
| The reader leaves after clicking or typing | Remounts the component and starts the take over. |
| The box scrolls out of view, or the tab is hidden | Pauses. |
| The reader prefers reduced motion | Shows the first frame and a Play button. Play runs the take once. |
| The take ends | Calls `onEnd`. Holds the final state for `loopDelay`, then cross-fades back if the DOM changed and starts over. With `loop={false}`, it returns to the first frame and a Play button instead, or holds the final state with a Play button if `loopDelay` is `Infinity`. |
| Play is pressed at the end | Starts the take over from the first frame. |

## Recording format

```ts
type Recording = {
  v: 1;
  size: [width: number, height: number];
  targets: string[]; // "@name", or a CSS path from the content root
  events: (
    | [t: number, "m", x: number, y: number]
    | [t: number, "d" | "u" | "c", x: number, y: number, target?: number, offsetX?: number, offsetY?: number]
    | [t: number, "k", key: string, target?: number, mods?: number]
  )[];
};
```

## Limits

A component that calls `setPointerCapture` during a replay throws, because the synthetic pointer isn't active. Recorded Tab presses don't move focus. Enter and Space activate buttons and checkboxes the way a browser would, and typing works in text inputs and textareas.
