import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // The agent's browser (screenshots): loaded at run time, never bundled.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Images uploaded through the admin: served by the app itself locally, and
    // from Cloudinary (or Vercel Blob) in production.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // The previous jomiez.com (the portfolio) used these addresses. Old links and
  // search results land on their new pages instead of a 404.
  async redirects() {
    const to = (source: string, destination: string) => ({ source, destination, permanent: true });
    return [
      to("/home.html", "/"),
      to("/index.html", "/"),
      to("/about.html", "/about"),
      to("/services.html", "/services"),
      to("/services/:slug", "/services"),
      to("/unique-offerring-pages/:path*", "/services"),
      to("/works", "/work"),
      to("/works.html", "/work"),
      to("/work-detail-page/:path*", "/work"),
      to("/testimonials", "/about"),
      to("/testimonials.html", "/about"),
      to("/resume", "/about"),
      to("/resume.html", "/about"),
      to("/contact-us", "/contact"),
      to("/contact-us.html", "/contact"),
      to("/blog", "/insights"),
      to("/blog/:slug", "/insights"),
      to("/privacy-policy.html", "/privacy-policy"),
      to("/terms-condition", "/terms-conditions"),
      to("/terms-condition.html", "/terms-conditions"),
      to("/404.html", "/"),
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
