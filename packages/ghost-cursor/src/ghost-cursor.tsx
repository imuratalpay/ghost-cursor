import { forwardRef, lazy, useSyncExternalStore } from "react";
import { Player, type GhostCursorHandle, type StageProps } from "./player";
import type { RecordingInput } from "./recording";

declare const process: { env: { NODE_ENV?: string } };

const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";

// Loaded only when a page is opened with ?record in development.
const DevRecorderPanel = isDev ? lazy(() => import("./recorder-panel")) : null;

const noop = () => () => {};
const readRecordFlag = () => isDev && new URLSearchParams(window.location.search).has("record");
const serverFalse = () => false;

export interface GhostCursorProps extends StageProps {
  /** A recording made with the recorder, usually imported from a JSON file. */
  recording: RecordingInput;
  /**
   * How long the final state stays on screen before the loop restarts, in ms.
   * With `loop={false}`, how long it stays before the first frame and the Play button return;
   * `Infinity` holds the final state.
   */
  loopDelay?: number;
  /** Start the take over after `loopDelay`. Reduced motion turns it off. */
  loop?: boolean;
  /** Start playing on mount. When false, the first frame shows with a Play button. Reduced motion turns it off. */
  autoplay?: boolean;
  /** Called each time a playthrough reaches its last frame, once per loop. Seeking to the end doesn't count. */
  onEnd?: () => void;
}

/**
 * Replays `recording` over `children` with a ghost cursor and real DOM events.
 * In development, `?record` in the URL swaps the player for a recorder.
 */
export const GhostCursor = forwardRef<GhostCursorHandle, GhostCursorProps>(function GhostCursor(
  { loopDelay = 1600, loop = true, autoplay = true, ...props },
  ref,
) {
  const recordMode = useSyncExternalStore(noop, readRecordFlag, serverFalse);
  return (
    <Player
      {...props}
      loopDelay={loopDelay}
      loop={loop}
      autoplay={autoplay}
      handleRef={ref}
      recordMode={recordMode}
      Panel={DevRecorderPanel}
    />
  );
});
