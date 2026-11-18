"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

/** Cross-fades two icons with a deep scale and a little blur, so the swap reads as a change of state. */
export function IconSwap({ id, children }: { id: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={id}
        className="grid place-items-center"
        initial={{ scale: 0.3, opacity: 0, filter: "blur(3px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        exit={{ scale: 0.3, opacity: 0, filter: "blur(3px)" }}
        transition={{ type: "spring", duration: 0.35, bounce: 0 }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
