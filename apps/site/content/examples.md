# Examples

Each demo on the HTML page is the real component, replaying a take.

## Dropdown menu

The highlight comes from the menu's own `pointermove` handler and the reorder from its click handler. The menu has no replay code; it only has `data-ghost-id` on the trigger and the items. Recorded by hand. The take ends on "A to Z", so the menu cross-fades back to "Newest" before each loop.

## Segmented control and switch

The pill and the tiles move on springs. Arrow keys move the selection with no animation, because a keyboard change should land instantly. The take ends where it started, so the loop restarts without a cross-fade.

## Typing

Key presses replay as `keydown` and `keyup`. Printable keys also insert text through an `input` event, which is what React's `onChange` listens for. Recorded by the agent script from four steps.

## The recorder, replaying itself

A `<Recorder captureSynthetic>` inside a `<GhostReplay>`. The outer ghost records a take with the inner recorder and presses Preview, and a second ghost replays it.
