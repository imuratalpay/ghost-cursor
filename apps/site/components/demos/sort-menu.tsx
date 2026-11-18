"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

const OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "popular", label: "Most popular" },
  { id: "alpha", label: "A to Z" },
] as const;

type OptionId = (typeof OPTIONS)[number]["id"];

const POSTS = [
  { title: "Springs, not curves", date: 4, reads: 1240 },
  { title: "The cost of a hover", date: 3, reads: 3810 },
  { title: "Ghosts in the DOM", date: 2, reads: 2275 },
  { title: "A menu, slowly", date: 1, reads: 960 },
];

const SORTS: Record<OptionId, (a: (typeof POSTS)[number], b: (typeof POSTS)[number]) => number> = {
  newest: (a, b) => b.date - a.date,
  oldest: (a, b) => a.date - b.date,
  popular: (a, b) => b.reads - a.reads,
  alpha: (a, b) => a.title.localeCompare(b.title),
};

export function SortMenu() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<OptionId>("newest");
  const [highlight, setHighlight] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const label = OPTIONS.find((o) => o.id === value)!.label;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const show = (viaKeyboard: boolean) => {
    setOpen(true);
    setHighlight(viaKeyboard ? OPTIONS.findIndex((o) => o.id === value) : null);
    // Keyboard users get focus in the menu; pointer users keep it on the trigger.
    if (viaKeyboard) requestAnimationFrame(() => menuRef.current?.focus({ preventScroll: true }));
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    setHighlight(null);
    if (refocus) triggerRef.current?.focus({ preventScroll: true });
  };

  const choose = (next: OptionId, refocus: boolean) => {
    setValue(next);
    close(refocus);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        show(true);
      }
      return;
    }
    const last = OPTIONS.length - 1;
    const current = highlight ?? -1;
    if (e.key === "ArrowDown") setHighlight(current >= last ? 0 : current + 1);
    else if (e.key === "ArrowUp") setHighlight(current <= 0 ? last : current - 1);
    else if (e.key === "Home") setHighlight(0);
    else if (e.key === "End") setHighlight(last);
    else if ((e.key === "Enter" || e.key === " ") && highlight !== null) choose(OPTIONS[highlight].id, true);
    else if (e.key === "Escape") close(true);
    else if (e.key === "Tab") return close(false);
    else return;
    e.preventDefault();
  };

  return (
    <div className="flex h-full flex-col items-center px-6 pt-9 font-sans">
      <div className="flex w-full max-w-[340px] items-center justify-between">
        <span className="text-[13px] font-medium text-fg-1">Writing</span>
        <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
          <button
            ref={triggerRef}
            type="button"
            data-ghost-id="sort-trigger"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? `${id}-menu` : undefined}
            onClick={(e) => (open ? close(false) : show(e.detail === 0))}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface pr-2 pl-3 text-[13px] text-fg-3 shadow-[0_0_0_1px_var(--line),var(--lift)] transition-[box-shadow,scale] duration-150 ease-out hover:shadow-[0_0_0_1px_var(--line-strong),var(--lift)] active:scale-[0.97] aria-expanded:shadow-[0_0_0_1px_var(--line-strong),var(--lift)]"
          >
            Sort: <span className="font-medium text-fg-1">{label}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="text-fg-3">
              <path d="M4.5 5.5 7 3l2.5 2.5M4.5 8.5 7 11l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                id={`${id}-menu`}
                role="menu"
                tabIndex={-1}
                aria-label="Sort by"
                aria-activedescendant={highlight !== null ? `${id}-${OPTIONS[highlight].id}` : undefined}
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1, ease: "easeIn" } }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformOrigin: "top right" }}
                className="absolute top-[calc(100%+6px)] right-0 z-10 w-44 rounded-xl bg-surface p-1 shadow-[0_0_0_1px_var(--line),var(--pop)] outline-none"
                onPointerLeave={() => setHighlight(null)}
              >
                {OPTIONS.map((o, i) => (
                  <div
                    key={o.id}
                    id={`${id}-${o.id}`}
                    role="menuitemradio"
                    aria-checked={value === o.id}
                    data-ghost-id={`sort-${o.id}`}
                    data-highlighted={highlight === i || undefined}
                    onPointerMove={() => highlight !== i && setHighlight(i)}
                    onClick={() => choose(o.id, document.activeElement === menuRef.current)}
                    className="flex h-8 cursor-default items-center gap-2 rounded-lg px-2 text-[13px] text-fg-2 select-none data-highlighted:bg-tint data-highlighted:text-fg-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className={value === o.id ? "opacity-100" : "opacity-0"}>
                      <path d="m3.5 7.25 2.25 2.25 4.75-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {o.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ul className="mt-4 w-full max-w-[340px] divide-y divide-line rounded-xl bg-surface shadow-[0_0_0_1px_var(--line)]">
        {[...POSTS].sort(SORTS[value]).map((post) => (
          <motion.li
            key={post.title}
            layout="position"
            transition={{ type: "spring", stiffness: 500, damping: 44 }}
            className="flex h-11 items-center justify-between px-4 text-[13px]"
          >
            <span className="text-fg-1">{post.title}</span>
            <span className="text-fg-3 tabular-nums">{post.reads.toLocaleString("en-US")} reads</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
