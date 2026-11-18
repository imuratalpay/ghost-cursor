import { Player, type StageProps } from "./player";
import RecorderPanel from "./recorder-panel";
import type { Recording } from "./recording";

const EMPTY: Recording = { v: 1, size: [0, 0], targets: [], events: [] };

export interface RecorderProps extends StageProps {
  /** Called with each finished take, when Stop is pressed. */
  onRecord?: (recording: Recording) => void;
  /**
   * Also record events dispatched by scripts, not only real input.
   * Turn it on when a GhostCursor replays a demo of the recorder itself.
   */
  captureSynthetic?: boolean;
}

/** A recorder you can ship: Record, Stop, Copy recording and Preview, in any environment. */
export function Recorder({ onRecord, captureSynthetic = false, ...props }: RecorderProps) {
  return (
    <Player
      {...props}
      recording={EMPTY}
      loopDelay={1600}
      recordMode
      Panel={RecorderPanel}
      onRecord={onRecord}
      captureSynthetic={captureSynthetic}
    />
  );
}
