"use client";

import { Recorder } from "@imuratalpay/ghost-cursor";
import { LikeButton } from "./like-button";

/** The real recorder around a small component, so a GhostCursor can replay someone using it. */
export function RecorderDemo() {
  return (
    <div className="flex h-full items-center justify-center px-5">
      <div className="w-full max-w-[440px]">
        <Recorder captureSynthetic className="h-[150px] min-h-0 bg-surface">
          <LikeButton />
        </Recorder>
      </div>
    </div>
  );
}
