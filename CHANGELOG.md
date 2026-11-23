# Changelog

## 0.2.0 (2026-11-23)

### Added

- `loop` prop, default `true`. With `loop={false}` the take plays once, then the first frame and a Play button return after `loopDelay`. With `loopDelay={Infinity}` too, the final state stays on screen.
- `autoplay` prop, default `true`. With `autoplay={false}` the first frame shows with a Play button until the reader presses Play.
- `onEnd` prop. Called each time a run reaches its last frame: once per loop, or once with `loop={false}`. A seek or a scrub that lands on the end doesn't call it, and neither does a run the reader interrupts.
- A ref on `GhostCursor` / `GhostReplay` holds a `GhostCursorHandle` with `play()`, `togglePause()` and `seek(ms)`. `GhostCursorHandle` and `GhostReplayHandle` are exported.

### Fixed

- Pressing Play on a take that has reached its end now starts it over from the first frame. Before, it only unpaused, so a take paused at its end, or held there with `loopDelay={Infinity}`, never replayed.
- While `loop={false}` and `loopDelay={Infinity}` hold the final state, the control shows Play instead of Pause, and one press starts the take over.
- When the component remounts under a pointer that is already in the box, a repeated `pointerenter` no longer counts as the reader arriving. Only a pointer that comes in from outside hands the component over.

### Unchanged

- Without the new props, playback behaves as in 0.1.0: it autoplays, loops after 1600ms, and with reduced motion shows the first frame and a Play button that runs the take once.
- The recording format, the handoff when the reader moves in, and the pause offscreen and in hidden tabs.
