import type { MetadataRoute } from "next";
import { DOCS } from "@/components/docs-pages";

const SITE_URL = "https://ghost-cursor.muratalpay.me";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL }, ...DOCS.map((page) => ({ url: `${SITE_URL}${page.href}` }))];
}
