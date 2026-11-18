"use client";

import { useState } from "react";
import { IconSwap } from "./icon-swap";

export function LikeButton() {
  const [liked, setLiked] = useState(false);

  return (
    <div className="grid h-full place-items-center font-sans">
      <button
        type="button"
        data-ghost-id="like"
        aria-pressed={liked}
        onClick={() => setLiked((l) => !l)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-surface pr-4 pl-3 text-[14px] font-medium text-fg-2 shadow-[0_0_0_1px_var(--line),var(--lift)] transition-[box-shadow,scale] duration-150 ease-out hover:shadow-[0_0_0_1px_var(--line-strong),var(--lift)] active:scale-[0.96]"
      >
        <IconSwap id={liked ? "on" : "off"}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path
              d="M9 15.2s-5.75-3.4-5.75-7.6A3.1 3.1 0 0 1 9 5.9a3.1 3.1 0 0 1 5.75 1.7c0 4.2-5.75 7.6-5.75 7.6Z"
              fill={liked ? "#e5484d" : "none"}
              stroke={liked ? "#e5484d" : "currentColor"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </IconSwap>
        <span className="sr-only">Like, </span>
        <span className="tabular-nums">{liked ? 42 : 41}</span>
      </button>
    </div>
  );
}
