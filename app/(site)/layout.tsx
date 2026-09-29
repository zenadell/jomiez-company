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
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { PageTransitions } from "@/components/layout/PageTransitions";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { CursorLens } from "@/components/ui/CursorLens";
import { getGlobal, img, isPreview } from "@/lib/cms";

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
  const [site, nav, effects, preview] = await Promise.all([
    getGlobal("site"),
    getGlobal("navigation"),
    getGlobal("effects"),
    isPreview(),
  ]);

  return (
    <html lang="en" className={interDisplay.variable}>
      <body>
        <SiteDataProvider value={{ site, nav, effects }}>
          {effects.smoothScroll !== false && <SmoothScroll />}
          {effects.pageTransitions !== false && <PageTransitions />}
          <Nav />
          <main className="page-shell">{children}</main>
          <Footer />
          {effects.cursorLens !== false && <CursorLens size={effects.lensSize ?? 132} />}
          {preview && <LivePreview />}
        </SiteDataProvider>
      </body>
    </html>
  );
}
