"use client";

import { LayoutGroup, motion } from "motion/react";
import { useId, useRef, useState } from "react";

const LAYOUTS = [
  { id: "list", label: "List" },
  { id: "grid", label: "Grid" },
  { id: "gallery", label: "Gallery" },
] as const;

type Layout = (typeof LAYOUTS)[number]["id"];

const TILES = ["var(--tile-a)", "var(--tile-b)", "var(--tile-a)", "var(--tile-b)", "var(--tile-a)", "var(--tile-b)"];

const SPRING = { type: "spring", stiffness: 520, damping: 44 } as const;

export function ViewSettings() {
  const id = useId();
  const [layout, setLayout] = useState<Layout>("list");
  const [compact, setCompact] = useState(false);
  // Keyboard changes jump; only pointer changes slide the pill.
  const [instant, setInstant] = useState(false);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (i: number, viaKeyboard: boolean) => {
    setInstant(viaKeyboard);
    setLayout(LAYOUTS[i].id);
    if (viaKeyboard) radios.current[i]?.focus();
  };

  const grid =
    layout === "list" ? "grid-cols-1" : layout === "grid" ? "grid-cols-3" : "grid-cols-2";
  const tileHeight =
    layout === "list" ? (compact ? 18 : 26) : layout === "grid" ? (compact ? 44 : 58) : compact ? 64 : 84;

  return (
    <div className="flex h-full flex-col items-center px-6 pt-8 font-sans">
      <div className="flex w-full max-w-[380px] flex-wrap items-center justify-between gap-3">
        <LayoutGroup id={id}>
          <div
            role="radiogroup"
            aria-label="Layout"
            className="inline-flex rounded-[10px] bg-tint p-0.5"
            onKeyDown={(e) => {
              const i = LAYOUTS.findIndex((l) => l.id === layout);
              const n = LAYOUTS.length;
              if (e.key === "ArrowRight" || e.key === "ArrowDown") select((i + 1) % n, true);
              else if (e.key === "ArrowLeft" || e.key === "ArrowUp") select((i - 1 + n) % n, true);
              else return;
              e.preventDefault();
            }}
          >
            {LAYOUTS.map((l, i) => {
              const checked = layout === l.id;
              return (
                <button
                  key={l.id}
                  ref={(el) => {
                    radios.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  data-ghost-id={`layout-${l.id}`}
                  onClick={(e) => select(i, e.detail === 0)}
                  className="relative isolate h-7 rounded-lg px-3 text-[13px] font-medium text-fg-3 transition-colors duration-(--duration-quick) ease-out hover:text-fg-1 aria-checked:text-fg-1"
                >
                  {checked && (
                    <motion.span
                      layoutId="pill"
                      transition={instant ? { duration: 0 } : SPRING}
                      className="absolute inset-0 -z-10 rounded-lg bg-surface shadow-[0_0_0_0.5px_var(--line-strong),var(--lift)]"
                    />
                  )}
                  {l.label}
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-fg-2 select-none">
          Compact
          <button
            type="button"
            role="switch"
            aria-checked={compact}
            data-ghost-id="compact"
            onClick={() => setCompact((c) => !c)}
            className="relative h-[22px] w-9 rounded-full bg-track transition-[background-color,scale] duration-(--duration-quick) ease-out active:scale-[0.95] aria-checked:bg-switch-on"
          >
            <motion.span
              initial={false}
              animate={{ x: compact ? 14 : 0 }}
              transition={SPRING}
              className="absolute top-0.5 left-0.5 size-[18px] rounded-full bg-switch-thumb shadow-[0_1px_2px_rgb(0_0_0/0.2)]"
            />
          </button>
        </label>
      </div>

      <div className="relative mt-4 h-[188px] w-full max-w-[380px] overflow-hidden rounded-xl bg-surface p-2.5 shadow-[0_0_0_1px_var(--line)] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
        <div className={`grid ${grid} ${compact ? "gap-1.5" : "gap-2.5"}`}>
          {TILES.map((color, i) => (
            <motion.div
              key={i}
              layout
              transition={SPRING}
              style={{ height: tileHeight, borderRadius: compact ? 6 : 9, backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
