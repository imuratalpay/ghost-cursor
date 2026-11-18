---
name: ghost-cursor
description: Record a replayable ghost-cursor demo of a React component without a human at the mouse. Wrap the component in <GhostCursor>, describe the take as steps (click, hover, type, press, wait, move), and run the bundled Playwright script, which performs the steps with human-like movement, writes recordings/<name>.json and checks that the replay ends in the same state. Use when the user asks to add, record, re-record or fix a ghost-cursor demo, a "live demo" or "replayable demo" of a component, or when a recording no longer matches the component after a UI change.
---

# Recording ghost-cursor demos

`<GhostCursor>` replays a recording over a real component by dispatching real DOM events. A recording is a JSON file. This skill makes that file from a short step list, so you never need a person to perform the take.

The script drives the dev-only recorder that `?record` turns on, using Playwright mouse and keyboard input. It moves like a hand: curved paths, minimum-jerk easing, a speed that varies per move, a small overshoot and correction on moves longer than 140px, and pauses before and after each press. The output is the same format a person produces with the Record button.

## When to use it

- The user wants a new demo for a component in a post or docs page.
- A component changed and its demo now clicks the wrong thing, or the script's check fails.
- The user describes an interaction ("open the menu and pick Oldest") rather than recording it.

Don't use it to test a component. The check confirms the replay reproduces the take, not that the component is correct.

## Steps

### 1. Wrap the component and name its targets

```tsx
import { GhostCursor } from "@psychedelichip/ghost-cursor";
import recording from "./recordings/filter-list.json";

<GhostCursor recording={recording} className="h-[300px]">
  <FilterList />
</GhostCursor>

// inside FilterList
<input data-ghost-id="filter-input" />
<li data-ghost-id={`option-${slug(item)}`}>{item}</li>
```

- Every element a step clicks, hovers or types into needs `data-ghost-id`. Recordings store `@name` for those; anything else becomes a CSS path that breaks when markup moves.
- The stage needs a height that fits the component's open states, such as an open menu. Content outside the stage is clipped.
- If the JSON file doesn't exist yet, create a placeholder so the import resolves:

```json
{"v":1,"size":[640,300],"targets":[],"events":[[0,"m",0.5,0.5]]}
```

### 2. Start the dev server

The recorder only exists in development builds. Start the app's dev server (`npm run dev`, or the workspace's equivalent) and note the URL of the page with the demo. Leave it running; the script reads the page twice.

### 3. Run the script

```bash
npx tsx skills/ghost-cursor/scripts/record.ts \
  --url http://localhost:3000/docs/recording \
  --out apps/site/recordings/filter-list.json \
  'click @filter-input' 'type "to"' 'hover @option-toast' 'click @option-tooltip'
```

Pass one step per argument. Quote each step so the shell keeps it whole.

| Step | Effect |
| --- | --- |
| `click <target>` | Move to the target, press, release, then pause 260 to 520ms. |
| `hover <target>` | Move to the target and rest 380 to 750ms. |
| `type "<text>"` | Type into the focused element, 65 to 160ms per key. Click the input first. |
| `press <Key>` | One key: `Enter`, `Escape`, `ArrowDown`, `Tab`. |
| `wait <ms>` | Do nothing. A final wait also delays the state check, up to 1400ms. |
| `move <x> <y>` | Move to a point in the stage, 0 to 1 on each axis. Use it to rest somewhere neutral. |

Targets are `@name` for `data-ghost-id="name"`, `text="Label"` for an exact visible label, or any CSS selector. They resolve inside the demo's stage.

Options:

- `--root <target>`: pick the demo containing this target. The default is the first step's target. Needed when the first step is `move` or `wait`.
- `--index <n>`: when several demos on the page contain the target, use the nth, counting from 0.
- `--ignore <css>`: leave matching elements out of the state check. Use it for clocks, counters and random values. Repeatable.
- `--seed <n>`: a different seed gives a different but repeatable path.
- `--speed <n>`: scale movement speed. Keep it between 0.7 and 1.3 so the motion still reads as a hand.
- `--headed`: watch the browser.

### 4. Read the result

A good run prints two check marks:

```
✓ recorded 4 steps → apps/site/recordings/filter-list.json  (60 events, 2 presses, 4.0s, 1.6 KB)
  targets: @filter-input, @option-tooltip
✓ replay reached the end and matches the take's final state
```

The second line means the script reloaded the page without `?record`, waited for the replay to reach the end of the take, and compared the component's DOM with the DOM at the end of the take. Text, structure and attributes are compared. Inline styles, ids, and the ghost's own attributes are ignored.

Also check:

- The press count equals the number of `click` steps. A lower count means a click landed outside the stage.
- Every target starts with `@`. A CSS path in the list means an element is missing `data-ghost-id`.
- No `! page errors` line. An error during replay usually means the component calls `setPointerCapture`, which fails for the synthetic pointer.

Then tell the user what the demo does, step by step, and where the file is.

## When the check fails

| Message | Cause | Fix |
| --- | --- | --- |
| `<target> isn't on the page at this point in the take` | The element doesn't exist yet, or the id is wrong. | Add a step that opens it first, or fix the `data-ghost-id`. |
| `the recorder's record button is missing` | The server is a production build, or the page has no `<GhostCursor>`. | Use the dev server. |
| `the page isn't playing the new take yet` | The page doesn't import the `--out` file. | Fix the import path, then rerun. |
| `the component didn't react to the replay` | The component ignores synthetic events: it checks `event.isTrusted`, or relies on real focus. | Remove the check, or handle the click on the element itself. |
| `the replay ended in a different state` | The first difference is printed. | If it's a timer, count or random value, pass `--ignore`. If it's a real state, rerun with `--headed` and watch where the replay diverges. |

Two limits of replay to keep in mind when writing steps. Recorded Tab presses don't move focus, so tab through a form with clicks instead. A component that animates for longer than about 1.2s after the last step may be compared mid-animation; end the take with `wait 800`.
