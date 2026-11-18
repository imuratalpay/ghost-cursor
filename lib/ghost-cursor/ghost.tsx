"use client";

import { motion, type MotionValue } from "motion/react";

export type Ripple = { id: number; x: number; y: number };

const FADE = [0.23, 1, 0.32, 1] as const;

export function Ghost({
  x,
  y,
  visible,
  pressed,
  ripples,
  onRippleEnd,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  visible: boolean;
  pressed: boolean;
  ripples: Ripple[];
  onRippleEnd: (id: number) => void;
}) {
  return (
    <div className="gc-overlay" aria-hidden>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="gc-ripple"
          style={{ transform: `translate(${r.x}px, ${r.y}px)` }}
          onAnimationEnd={() => onRippleEnd(r.id)}
        />
      ))}
      <motion.div className="gc-ghost" style={{ x, y }}>
        <motion.div
          className="gc-arrow"
          initial={false}
          animate={{ opacity: visible ? 1 : 0, scale: !visible ? 0.92 : pressed ? 0.86 : 1 }}
          transition={{
            opacity: { duration: visible ? 0.22 : 0.14, ease: FADE },
            // Presses carry no momentum, so no bounce.
            scale: { type: "spring", stiffness: 700, damping: 48 },
          }}
        >
          <svg width="18" height="26" viewBox="0 0 14.5 21" fill="none">
            <path
              d="M1.5 1.5V17.4L5.3 13.9L7.7 19.5L9.9 18.6L7.6 13.1H12.8L1.5 1.5Z"
              fill="rgb(18 18 18 / 0.78)"
              stroke="rgb(255 255 255 / 0.95)"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
