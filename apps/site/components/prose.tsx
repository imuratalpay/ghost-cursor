import Link from "next/link";
import type { ReactNode } from "react";

export function Code({ children, title }: { children: string; title?: string }) {
  return (
    <div className="my-6">
      {title && <div className="label mb-2">{title}</div>}
      <pre className="overflow-x-auto rounded-xl bg-code px-5 py-4 text-fg-1 shadow-[inset_0_0_0_1px_var(--line)]">
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
}

export function C({ children }: { children: ReactNode }) {
  return <code className="rounded-[5px] bg-tint px-[0.3em] py-[0.15em]">{children}</code>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[5px] bg-surface px-[0.4em] py-[0.15em] shadow-[0_0_0_1px_var(--line-strong)]">
      {children}
    </kbd>
  );
}

export function Figure({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="my-8">
      {children}
      <figcaption className="mt-2 px-1 text-[13px] leading-[21.125px] text-pretty text-fg-3">{caption}</figcaption>
    </figure>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="link">
      {children}
    </Link>
  );
}

/** Page title on a reading page: the 24/32 step. */
export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-[24px] leading-[32px] tracking-[-0.3px]">{children}</h1>;
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-14 mb-2">
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="my-4">{children}</p>;
}

/** A numbered how-to step. On docs pages each one ends with a live demo. */
export function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <div className="label" aria-hidden>
        Step {n}
      </div>
      <h3 className="mt-1">
        <span className="sr-only">Step {n}: </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-[14px] leading-[22.75px]">
        <thead>
          <tr className="border-b border-line">
            {head.map((h) => (
              <th key={h} scope="col" className="pt-1 pr-4 pb-2 align-bottom">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line align-top">
              {row.map((cell, j) => (
                <td key={j} className={`py-3 pr-4 ${j === 0 ? "whitespace-nowrap text-fg-1" : ""}`}>
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

type PageLink = { href: string; title: string };

export function PrevNext({ prev, next }: { prev?: PageLink; next?: PageLink }) {
  return (
    <nav aria-label="Pages" className="mt-20 grid grid-cols-2 gap-4 border-t border-line pt-6">
      {prev ? (
        <Link href={prev.href} className="group -m-2 rounded-lg p-2">
          <span className="label block">Previous</span>
          <span className="text-fg-1 transition-colors duration-150 ease-out group-hover:text-fg-3">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} className="group -m-2 rounded-lg p-2 text-right">
          <span className="label block">Next</span>
          <span className="text-fg-1 transition-colors duration-150 ease-out group-hover:text-fg-3">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
