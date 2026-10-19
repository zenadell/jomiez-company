import type { MetadataRoute } from "next";
import { getGlobal } from "@/lib/cms";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getGlobal("site");
  return {
    // "/app$" and "/app/", not "/app": rules match by prefix, and "/app" also hid /apple-icon.png.
    // Lead previews (/preview/…) say noindex on their own pages, which needs them crawlable.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/next", "/app$", "/app/"] },
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
