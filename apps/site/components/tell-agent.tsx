"use client";

import { useEffect, useRef, useState } from "react";
import { IconSwap } from "./demos/icon-swap";

export function TellAgent({ sentence }: { sentence: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(sentence).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-start gap-3 rounded-xl bg-code py-3 pr-1.5 pl-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <q className="min-w-0 flex-1 py-[3px] text-[15px] leading-[24px] text-fg-1 before:content-none after:content-none">
        {sentence}
      </q>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy sentence"}
        onClick={copy}
        className="relative grid size-8 flex-none place-items-center rounded-lg text-fg-3 transition-[background-color,color,scale] duration-(--duration-quick) ease-out before:absolute before:-inset-1 hover:bg-tint hover:text-fg-1 active:scale-[0.96]"
      >
        <IconSwap id={copied ? "check" : "copy"}>
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="5.25" y="5.25" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.75 3.5V3.25a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5h.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          )}
        </IconSwap>
      </button>
    </div>
  );
}
