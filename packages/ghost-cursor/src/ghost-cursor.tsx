import { lazy, useSyncExternalStore } from "react";
import { Player, type StageProps } from "./player";
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
  /** How long the final state stays on screen before the loop restarts, in ms. */
  loopDelay?: number;
}

/**
 * Replays `recording` over `children` with a ghost cursor and real DOM events.
 * In development, `?record` in the URL swaps the player for a recorder.
 */
export function GhostCursor({ loopDelay = 1600, ...props }: GhostCursorProps) {
  const recordMode = useSyncExternalStore(noop, readRecordFlag, serverFalse);
  return <Player {...props} loopDelay={loopDelay} recordMode={recordMode} Panel={DevRecorderPanel} />;
}
