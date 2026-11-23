"use client";

import { GhostReplay, type GhostCursorHandle } from "@imuratalpay/ghost-cursor";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SortMenu } from "@/components/demos/sort-menu";
import sortMenu from "@/recordings/sort-menu.json";

/** What the tests read and call. `mounts` counts every (re)mount of the demo's children. */
type Probe = { ends: number[]; mounts: number; handle: GhostCursorHandle | null };

function probe(): Probe {
  const w = window as unknown as { __playback?: Probe };
  w.__playback ??= { ends: [], mounts: 0, handle: null };
  return w.__playback;
}

function Counted({ children }: { children: ReactNode }) {
  useEffect(() => {
    probe().mounts++;
  }, []);
  return children;
}

const flag = (value: string | null) => (value === null ? undefined : value !== "false" && value !== "0");

/** `?loop=false&autoplay=false&delay=300|inf` */
export function PlaybackHarness() {
  const params = useSearchParams();
  const delay = params.get("delay");
  const loopDelay = delay === "inf" ? Infinity : delay ? Number(delay) : undefined;
  const ref = useRef<GhostCursorHandle>(null);
  const [ends, setEnds] = useState(0);

  useEffect(() => {
    probe().handle = ref.current;
  }, []);

  return (
    <>
      <button type="button" data-testid="before" className="mb-4 text-fg-3">
        Before the demo
      </button>
      <GhostReplay
        ref={ref}
        recording={sortMenu}
        className="h-[340px]"
        loop={flag(params.get("loop"))}
        autoplay={flag(params.get("autoplay"))}
        loopDelay={loopDelay}
        onEnd={() => {
          probe().ends.push(performance.now());
          setEnds((n) => n + 1);
        }}
      >
        <Counted>
          <SortMenu />
        </Counted>
      </GhostReplay>
      <output data-testid="ends" className="mt-4 block text-fg-3">
        {ends}
      </output>
    </>
  );
}
