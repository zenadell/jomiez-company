import type { MetadataRoute } from "next";
import { getGlobal } from "@/lib/cms";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getGlobal("site");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/next", "/app"] },
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
