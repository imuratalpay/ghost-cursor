import { Suspense } from "react";
import { DocsNav } from "@/components/docs-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="mx-auto max-w-[684px] px-5 pb-24">
      <SiteHeader />
      <div className="mt-6 mb-12">
        <Suspense>
          <DocsNav />
        </Suspense>
      </div>
      <main>{children}</main>
      <Suspense>
        <SiteFooter />
      </Suspense>
    </div>
  );
}
