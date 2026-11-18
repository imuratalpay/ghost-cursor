import { motion, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode, type RefObject } from "react";
import type { Engine, EngineState } from "./engine";

const SPEEDS = [0.5, 1] as const;

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      {/* Shifted toward the point so it reads as centered. */}
      <path d="M3.5 1.9v8.2c0 .5.5.8 1 .5l6.4-4.1c.4-.3.4-.8 0-1.1L4.5 1.4c-.5-.3-1 0-1 .5Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <rect x="2.25" y="1.5" width="2.75" height="9" rx="0.9" fill="currentColor" />
      <rect x="7" y="1.5" width="2.75" height="9" rx="0.9" fill="currentColor" />
    </svg>
  );
}

export function Controls({
  engine,
  state,
  progress,
  timeRef,
  duration,
  speed,
  onSpeed,
  extra,
}: {
  engine: RefObject<Engine | null>;
  state: EngineState;
  progress: MotionValue<number>;
  timeRef: RefObject<HTMLSpanElement | null>;
  duration: number;
  speed: number;
  onSpeed: (speed: number) => void;
  extra?: ReactNode;
}) {
  const playing = !state.idle && !state.paused;

  return (
    <div className="gc-controls">
      {state.idle ? (
        <button type="button" className="gc-play-pill" onClick={() => engine.current?.play()}>
          <PlayIcon />
          Play
        </button>
      ) : (
        <button
          type="button"
          className="gc-button"
          aria-label={playing ? "Pause demo" : "Play demo"}
          aria-keyshortcuts="Space"
          onClick={() => engine.current?.togglePause()}
        >
          <span className="gc-icon" data-shown={!playing || undefined}>
            <PlayIcon />
          </span>
          <span className="gc-icon" data-shown={playing || undefined}>
            <PauseIcon />
          </span>
        </button>
      )}
      <Scrubber engine={engine} progress={progress} duration={duration} />
      <span className="gc-time" ref={timeRef}>
        0.0s
      </span>
      <div className="gc-speed" role="group" aria-label="Playback speed">
        {SPEEDS.map((s) => (
          <button key={s} type="button" aria-pressed={speed === s} onClick={() => onSpeed(s)}>
            {s === 0.5 ? "0.5×" : "1×"}
          </button>
        ))}
      </div>
      {extra}
    </div>
  );
}

function Scrubber({
  engine,
  progress,
  duration,
}: {
  engine: RefObject<Engine | null>;
  progress: MotionValue<number>;
  duration: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const thumbX = useTransform(progress, (p) => `${p * 100}%`);

  const seekTo = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    engine.current?.seek(k * duration);
  };

  const nudge = (ms: number) => {
    const e = engine.current;
    if (!e) return;
    e.seek(Math.min(duration, Math.max(0, progress.get() * duration + ms)));
  };

  return (
    <div
      ref={ref}
      className="gc-scrubber"
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration / 100) / 10}
      aria-valuenow={0}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.dataset.dragging = "";
        engine.current?.setBlocked("scrub", true);
        seekTo(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) seekTo(e.clientX);
      }}
      onPointerUp={(e) => {
        delete e.currentTarget.dataset.dragging;
        engine.current?.setBlocked("scrub", false);
      }}
      onPointerCancel={(e) => {
        delete e.currentTarget.dataset.dragging;
        engine.current?.setBlocked("scrub", false);
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 1000 : 250;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") nudge(-step);
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") nudge(step);
        else if (e.key === "Home") engine.current?.seek(0);
        else if (e.key === "End") engine.current?.seek(duration);
        else return;
        e.preventDefault();
      }}
    >
      <div className="gc-track">
        <motion.div className="gc-fill" style={{ scaleX: progress }} />
      </div>
      <motion.div className="gc-thumb-rail" style={{ x: thumbX }}>
        <span className="gc-thumb" />
      </motion.div>
    </div>
  );
}
