import { Suspense } from "react";
import { DocsNav } from "@/components/docs-nav";
import { SiteFooter } from "@/components/site-footer";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="mx-auto max-w-[684px] px-5 pb-24">
      <div className="mt-6 mb-12">
        <Suspense>
          <DocsNav />
        </Suspense>
      </div>
      <main id="content">{children}</main>
      <Suspense>
        <SiteFooter />
      </Suspense>
    </div>
  );
}
