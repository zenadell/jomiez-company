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
import { site } from "@/content/site";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { PageTransitions } from "@/components/layout/PageTransitions";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { CursorLens } from "@/components/ui/CursorLens";

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

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.legalName,
    title: site.title,
    description: site.description,
    url: site.url,
    images: [{ url: "/media/og.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={interDisplay.variable}>
      <body>
        <SmoothScroll />
        <PageTransitions />
        <Nav />
        <main className="page-shell">{children}</main>
        <Footer />
        <CursorLens />
      </body>
    </html>
  );
}
