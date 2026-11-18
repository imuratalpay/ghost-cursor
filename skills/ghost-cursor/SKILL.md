---
name: ghost-cursor
description: Record a replayable ghost-cursor demo of a React component without a person at the mouse. Wrap the component in <GhostCursor>, write the take as steps (click, hover, type, press, wait, move), and run the bundled Playwright script. It performs the steps with human-like movement, writes recordings/<name>.json, and checks that the replay ends in the same state as the take. Use when asked to add, record, re-record or fix a ghost-cursor demo, a "live demo" or "replayable demo" of a component, or when a demo stopped matching its component after a UI change.
---

# Recording ghost-cursor demos

The script drives the dev-only recorder that `?record` turns on, with real Playwright input, so its output is the same JSON a person makes with the Record button. Your job is the step list and the targets; the script handles movement, timing and the check.

## Decide what to do

```
Does the component already have a <GhostCursor> and a recording file?
├── No → do steps 1 to 4
└── Yes
    Did the component's markup or behavior change since the take?
    ├── Yes → rerun step 3 with the same steps, then step 4
    └── No, but the check fails → go to "When the check fails"
```

Don't use this to test a component. The check proves the replay reproduces the take, not that the component behaves correctly.

## 1. Wrap the component and name every target

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

- Put `data-ghost-id` on every element a step clicks, hovers or types into. Without it the recording stores a CSS path such as `:scope > div:nth-child(2) > button:nth-child(1)`, which breaks the first time someone adds a wrapper.
- Set the box height to the tallest state the take reaches, such as an open menu, plus 24px. The box clips its content, and the cursor arrow is 26px tall, so anything lower gets cut off.
- If the JSON file doesn't exist, create it with this placeholder. The import must resolve before the dev server can render the page.

```json
{"v":1,"size":[640,300],"targets":[],"events":[[0,"m",0.5,0.5]]}
```

## 2. Start the dev server

Run the app's dev command and keep it running. The recorder exists only in development builds, and the script loads the page twice: once to record, once to check.

## 3. Run the script

```bash
npx tsx skills/ghost-cursor/scripts/record.ts \
  --url http://localhost:3000/docs/recording \
  --out apps/site/recordings/filter-list.json \
  'click @filter-input' 'type "to"' 'hover @option-toast' 'click @option-tooltip'
```

Quote each step, one per argument, so the shell keeps it whole.

| Step | What the script does |
| --- | --- |
| `click <target>` | Moves to the target, presses for 65 to 120ms, then pauses 260 to 520ms |
| `hover <target>` | Moves to the target and rests 380 to 750ms |
| `type "<text>"` | Types into the focused element at 65 to 160ms per key. Click the input first, because typing goes to whatever has focus |
| `press <Key>` | Presses one key, such as `Enter`, `Escape` or `ArrowDown` |
| `wait <ms>` | Waits. As the last step, it also delays the state check, up to 1400ms |
| `move <x> <y>` | Moves to a point in the box, 0 to 1 on each axis |

Targets are `@name` for `data-ghost-id="name"`, `text="Label"` for an exact visible label, or a CSS selector. They resolve inside the demo's box.

Write steps the way the reader should see them:

- Keep a take between 3 and 8 seconds. The final state holds for 1.6s before the loop restarts, so an 8s take already makes the reader wait almost 10s to see the start again.
- End where you started when you can (menu closed, first option selected). Then the loop restarts without a cross-fade.
- Hover before a click only when the hover shows something, such as a highlight. A hover step adds about 1s: the move, then a 380 to 750ms rest.

Options:

| Option | Use it when |
| --- | --- |
| `--root <target>` | The first step is `move` or `wait`, so there's no target to find the demo by |
| `--index <n>` | Several demos on the page contain the first target. Counts from 0 |
| `--ignore <css>` | Part of the component changes on its own, such as a clock, a counter or a random value. Repeatable |
| `--seed <n>` | You want a different path. The same seed gives the same path |
| `--speed <n>` | The take is too slow or too fast. Stay between 0.7 and 1.3, because outside that range the motion stops looking like a hand |
| `--headed` | You need to watch the browser to see where a take goes wrong |

## 4. Read the result

A passing run ends with two check marks:

```
✓ recorded 4 steps → apps/site/recordings/filter-list.json  (60 events, 2 presses, 4.0s, 1.6 KB)
  targets: @filter-input, @option-tooltip
✓ replay reached the end and matches the take's final state
```

The second line means the script reloaded the page without `?record`, let the replay run to its end, and compared the component's DOM with the DOM at the end of the take. Before you report success, check three more things:

- `presses` equals the number of `click` steps. A lower count means a click landed outside the box, and the replay will skip it.
- Every entry in `targets` starts with `@`. A CSS path there means an element is missing `data-ghost-id`. Add one and rerun.
- There is no `! page errors` line. An error during replay usually means the component calls `setPointerCapture`, which throws for the synthetic pointer.

Then tell the user what the take does, step by step, and where the file is.

## When the check fails

| Message | Cause | Fix |
| --- | --- | --- |
| `<target> isn't on the page at this point in the take` | The element doesn't exist yet, or the id is wrong | Add a step that opens it first, or fix the `data-ghost-id` |
| `the recorder's record button is missing` | The server is a production build, or the page has no `<GhostCursor>` | Use the dev server |
| `pressing Record didn't start a take` | Something covers the recorder's buttons, such as a sticky header or a cookie banner | Close the overlay in the page, or pass a `--viewport` tall enough that the demo clears it |
| `the recorder stopped during the take` | The page reloaded, for example because the dev server rebuilt it | Wait for the dev server to finish compiling, then rerun |
| `the page isn't playing the new take yet` | The page doesn't import the `--out` file | Fix the import path and rerun |
| `the component didn't react to the replay` | The component ignores synthetic events: it checks `event.isTrusted`, or it waits on real focus | Remove the `isTrusted` check, or handle the click on the element itself |
| `the replay ended in a different state` | The first difference is printed under it | A timer, count or random value: pass `--ignore <selector>`. A real state: rerun with `--headed` and watch where the replay diverges |

Replay can't do two things, so don't write steps that need them:

- A recorded Tab doesn't move focus. Click the next field instead.
- The check runs at most 1.4s after the last input. If the component animates for longer, end the take with `wait 800` so both snapshots land after the animation.
