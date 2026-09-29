import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { articles } from "@/content/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/services", "/work", "/insights", "/contact", "/privacy-policy", "/terms-conditions"];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.7 })),
    ...projects.map((p) => ({ url: `${site.url}/work/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.6 })),
    ...articles.map((a) => ({ url: `${site.url}/insights/${a.slug}`, lastModified: a.date, priority: 0.5 })),
  ];
}
