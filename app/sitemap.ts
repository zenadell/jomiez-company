import type { MetadataRoute } from "next";
import { getArticles, getGlobal, getPageSlugs, getProjects } from "@/lib/cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, projects, articles, pages] = await Promise.all([
    getGlobal("site"),
    getProjects(),
    getArticles(),
    getPageSlugs(),
  ]);
  const base = site.url.replace(/\/$/, "");
  const fixed = ["", "/about", "/services", "/work", "/insights", "/contact", "/privacy-policy", "/terms-conditions"];
  return [
    ...fixed.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.7 })),
    ...pages.map((slug) => ({ url: `${base}/${slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...projects.map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
    ...articles.map((a) => ({ url: `${base}/insights/${a.slug}`, lastModified: a.date, priority: 0.5 })),
  ];
}
