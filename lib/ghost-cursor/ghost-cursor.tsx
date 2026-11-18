"use client";

import { useMotionValue, useSpring } from "motion/react";
import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { Controls } from "./controls";
import { Engine, type EngineHost, type EngineState } from "./engine";
import { Ghost, type Ripple } from "./ghost";
import { compile, type Recording, type RecordingInput } from "./recording";
import "./ghost-cursor.css";

const RecorderPanel =
  process.env.NODE_ENV === "development" ? lazy(() => import("./recorder-panel")) : () => null;

/** Soft and slightly behind the hand, like a cursor with a little weight. */
const SPRING = { stiffness: 420, damping: 40 };

const noop = () => () => {};
const readRecordFlag = () =>
  process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("record");

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (fn: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};
const readReduced = () => window.matchMedia(REDUCED).matches;
const serverFalse = () => false;

export interface GhostCursorProps {
  recording: RecordingInput;
  children: ReactNode;
  /** Applied to the stage — the box the ghost lives in. Give it a height. */
  className?: string;
  style?: CSSProperties;
  /** How long the final state stays on screen before the loop restarts (ms). */
  loopDelay?: number;
}

export function GhostCursor({ recording, children, className, style, loopDelay = 1600 }: GhostCursorProps) {
  // Server-safe: hydrates as false, then settles on the real value without a mismatch.
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, serverFalse);
  const recordMode = useSyncExternalStore(noop, readRecordFlag, serverFalse);
  const [view, setView] = useState<"record" | "play">("record");
  const [take, setTake] = useState<Recording | null>(null);
  const mode = recordMode ? view : "play";

  const compiled = useMemo(() => compile(take ?? recording), [take, recording]);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const [epoch, setEpoch] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [speed, setSpeed] = useState(1);
  const [ui, setUi] = useState<EngineState>({ idle: reduced, paused: false, handoff: false, speed: 1 });

  const gx = useSpring(0, SPRING);
  const gy = useSpring(0, SPRING);
  const progress = useMotionValue(0);
  const speedRef = useRef(1);

  useEffect(() => {
    if (mode !== "play") return;
    const stage = stageRef.current!;
    const content = contentRef.current!;
    const slider = rootRef.current!.querySelector<HTMLElement>('[role="slider"]');
    let rippleId = 0;
    let label = "";

    const host: EngineHost = {
      stage,
      content,
      moveGhost(x, y, jump) {
        if (jump) {
          gx.jump(x);
          gy.jump(y);
        } else {
          gx.set(x);
          gy.set(y);
        }
      },
      readGhost: () => [gx.get(), gy.get()],
      showGhost: setVisible,
      pressGhost(down, x, y, ripple) {
        setPressed(down);
        if (down && ripple) setRipples((r) => [...r.slice(-2), { id: ++rippleId, x, y }]);
      },
      remount: () => flushSync(() => setEpoch((e) => e + 1)),
      flush: (fn) => flushSync(fn),
      onTime(t, d) {
        progress.set(d ? t / d : 0);
        const next = `${(t / 1000).toFixed(1)}s`;
        if (next === label) return;
        label = next;
        if (timeRef.current) timeRef.current.textContent = next;
        slider?.setAttribute("aria-valuenow", (Math.round(t / 100) / 10).toString());
        slider?.setAttribute("aria-valuetext", `${next} of ${(d / 1000).toFixed(1)}s`);
      },
    };

    const engine = new Engine(compiled, host, {
      autoplay: !reduced,
      loop: !reduced,
      fade: !reduced,
      loopDelay,
    });
    engine.setSpeed(speedRef.current);
    engineRef.current = engine;
    const unsubscribe = engine.subscribe(() => setUi(engine.state));

    const io = new IntersectionObserver(([entry]) => engine.setBlocked("offscreen", !entry.isIntersecting));
    io.observe(stage);

    return () => {
      io.disconnect();
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
      setVisible(false);
      setPressed(false);
      setUi({ idle: reduced, paused: false, handoff: false, speed: speedRef.current });
    };
  }, [mode, compiled, reduced, loopDelay, gx, gy, progress]);

  // Space pauses while the reader is pointing at this demo or using its controls.
  // Inside the stage, keys belong to the component.
  useEffect(() => {
    const root = rootRef.current!;
    const stage = stageRef.current!;
    let hovering = false;
    const enter = () => (hovering = true);
    const leave = () => (hovering = false);
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as Element;
      if (stage.contains(target)) return;
      const inside = root.contains(target);
      if (inside && target.closest("button")) return;
      const free = target === document.body || target === document.documentElement;
      if (!inside && !(free && hovering)) return;
      e.preventDefault();
      engineRef.current?.togglePause();
    };
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);
    window.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const changeSpeed = (s: number) => {
    speedRef.current = s;
    setSpeed(s);
    engineRef.current?.setSpeed(s);
  };

  const remount = () => flushSync(() => setEpoch((e) => e + 1));

  return (
    <div ref={rootRef} className="gc-root" data-handoff={ui.handoff || undefined}>
      <div ref={stageRef} className={className ? `gc-stage ${className}` : "gc-stage"} style={style}>
        <div ref={contentRef} className="gc-content">
          <div key={epoch} className="gc-frame">
            {children}
          </div>
        </div>
        {mode === "play" && (
          <Ghost
            x={gx}
            y={gy}
            visible={visible}
            pressed={pressed}
            ripples={ripples}
            onRippleEnd={(id) => setRipples((r) => r.filter((p) => p.id !== id))}
          />
        )}
      </div>

      {mode === "record" ? (
        <Suspense fallback={<div className="gc-controls" />}>
          <RecorderPanel
            stage={stageRef}
            content={contentRef}
            remount={remount}
            initial={take}
            onPreview={(rec) => {
              remount();
              setTake(rec);
              setView("play");
            }}
          />
        </Suspense>
      ) : (
        <Controls
          engine={engineRef}
          state={ui}
          progress={progress}
          timeRef={timeRef}
          duration={compiled.duration}
          speed={speed}
          onSpeed={changeSpeed}
          extra={
            recordMode ? (
              <button
                type="button"
                className="gc-pill"
                onClick={() => {
                  remount();
                  setView("record");
                }}
              >
                Recorder
              </button>
            ) : null
          }
        />
      )}
    </div>
  );
}
