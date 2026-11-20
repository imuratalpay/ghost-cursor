import type { MetadataRoute } from "next";

const SITE_URL = "https://ghost-cursor.muratalpay.me";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
