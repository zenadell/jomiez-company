import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@fontsource/geist-mono/200.css";
import "@fontsource/geist-mono/300.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/jaini/400.css";
import "./globals.css";
import { LivePreview } from "@/components/cms/LivePreview";
import { SiteDataProvider } from "@/components/cms/SiteData";
import { LiveSiteData } from "@/components/cms/live/LiveSiteData";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { SiteLens, SiteMotion } from "@/components/layout/SiteEffects";
import { getGlobal, getNavPages, img, isPreview } from "@/lib/cms";

const interDisplay = localFont({
  src: [
    { path: "./fonts/InterDisplay-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/InterDisplay-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InterDisplay-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/InterDisplay-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/InterDisplay-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/InterDisplay-900.woff2", weight: "800 900", style: "normal" },
  ],
  variable: "--font-inter-display",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getGlobal("site");
  const og = img(site.ogImage);
  return {
    metadataBase: new URL(site.url),
    title: { default: site.title, template: site.titleTemplate || `%s | ${site.name}` },
    description: site.description,
    openGraph: {
      type: "website",
      siteName: site.legalName,
      title: site.title,
      description: site.description,
      url: site.url,
      images: og ? [{ url: og.src, width: og.width ?? 1200, height: og.height ?? 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title: site.title, description: site.description },
    icons: { icon: "/favicon.ico" },
  };
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, nav, effects, pages, preview] = await Promise.all([
    getGlobal("site"),
    getGlobal("navigation"),
    getGlobal("effects"),
    getNavPages(),
    isPreview(),
  ]);

  // In the admin's live preview, the shared settings follow their edit forms as they're typed.
  const Provider = preview ? LiveSiteData : SiteDataProvider;

  return (
    <html lang="en" className={interDisplay.variable}>
      <body>
        <Provider value={{ site, nav, effects, pages }}>
          <SiteMotion />
          <Nav />
          <main className="page-shell">{children}</main>
          <Footer />
          <SiteLens preview={preview} />
          {preview && <LivePreview />}
        </Provider>
      </body>
    </html>
  );
}
