"use client";

import { useEffect, useRef, useState } from "react";
import { IconSwap } from "./icon-swap";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
    // A replayed click has no user activation, so this may reject or never settle.
    navigator.clipboard?.writeText(command).catch(() => {});
  };

  return (
    <div className="flex h-full items-center justify-center px-6 font-sans">
      <div className="flex h-12 w-full max-w-[400px] items-center gap-3 rounded-xl bg-surface pr-2 pl-4 font-mono text-[13px] shadow-[0_0_0_1px_var(--line),var(--lift)]">
        <span className="text-fg-3 select-none" aria-hidden>
          $
        </span>
        <span className="min-w-0 flex-1 truncate text-fg-1">{command}</span>
        <button
          type="button"
          data-ghost-id="copy-command"
          aria-label={copied ? "Copied" : "Copy command"}
          onClick={copy}
          className="relative grid size-8 flex-none place-items-center rounded-lg text-fg-3 transition-[background-color,color,scale] duration-150 ease-out before:absolute before:-inset-1 hover:bg-tint hover:text-fg-1 active:scale-[0.96]"
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
    </div>
  );
}
