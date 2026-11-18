import { Suspense } from "react";
import { DocsNav } from "@/components/docs-nav";
import { SiteHeader } from "@/components/site-header";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-5 pt-6 pb-32 font-sans lg:flex-row lg:gap-16 lg:pt-14">
        <aside className="lg:sticky lg:top-14 lg:h-fit lg:w-44 lg:flex-none">
          <Suspense>
            <DocsNav />
          </Suspense>
        </aside>
        <main className="min-w-0 max-w-[680px] flex-1 text-[15.5px] leading-[1.7] text-neutral-700">{children}</main>
      </div>
    </>
  );
}
