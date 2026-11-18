import Link from "next/link";
import type { ReactNode } from "react";

export function Code({ children }: { children: string }) {
  return (
    <pre className="prose-code my-5 overflow-x-auto rounded-xl bg-[#f1f1ef] px-5 py-4 font-mono text-[13px] leading-[1.7] text-neutral-800 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)]">
      <code>{children.trim()}</code>
    </pre>
  );
}

export function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[5px] bg-black/[0.05] px-[0.3em] py-[0.1em] font-mono text-[0.82em] text-neutral-800">
      {children}
    </code>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[5px] bg-white px-[0.4em] py-[0.1em] font-sans text-[0.78em] font-medium text-neutral-700 shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_1px_0_rgb(0_0_0/0.08)]">
      {children}
    </kbd>
  );
}

export function Figure({ caption, children, wide = true }: { caption: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <figure className={wide ? "my-8 sm:-mx-8" : "my-8"}>
      {children}
      <figcaption
        className={`mt-2 px-1 font-sans text-[13px] leading-relaxed text-pretty text-neutral-500 ${wide ? "sm:px-9" : ""}`}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-neutral-900 underline decoration-neutral-300 underline-offset-[3px] transition-colors duration-150 ease-out hover:decoration-neutral-900"
    >
      {children}
    </Link>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-serif text-[36px] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-neutral-900">
      {children}
    </h1>
  );
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-14 mb-3 font-serif text-[25px] leading-tight font-medium tracking-[-0.01em] text-balance text-neutral-900"
    >
      {children}
    </h2>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[17px] leading-[1.6] text-pretty text-neutral-600">{children}</p>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="my-4 text-pretty">{children}</p>;
}

/** A numbered how-to step. Each one ends with a live demo. */
export function Step({ n, title, id, children }: { n: number; title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="relative mt-12 sm:pl-10">
      <span
        aria-hidden
        className="mb-2 flex size-6 items-center justify-center rounded-full bg-neutral-900 font-sans text-[12px] font-medium text-white tabular-nums sm:absolute sm:top-0.5 sm:left-0 sm:mb-0"
      >
        {n}
      </span>
      <h3 className="text-[17px] leading-7 font-semibold tracking-[-0.01em] text-neutral-900">
        <span className="sr-only">Step {n}: </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="prose-code my-5 overflow-x-auto rounded-xl shadow-[inset_0_0_0_1px_rgb(0_0_0/0.07)]">
      <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
        <thead>
          <tr className="text-[12px] text-neutral-500">
            {head.map((h) => (
              <th key={h} className="px-4 pt-3 pb-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-black/[0.06] align-top">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 leading-relaxed ${j === 0 ? "whitespace-nowrap" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Next({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group mt-16 flex items-center justify-between rounded-xl px-5 py-4 font-sans text-[14px] text-neutral-500 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] transition-[box-shadow,color] duration-150 ease-out hover:text-neutral-900 hover:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.16)]"
    >
      <span>
        Next: <span className="font-medium text-neutral-900">{children}</span>
      </span>
      <span aria-hidden className="transition-transform duration-150 ease-out group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
