import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./glass.css";
import "./app.css";

/*
 * The phone app's own root layout (/app): installable from the browser to the
 * home screen on iPhone and Android, with nothing of the public site's chrome.
 */

const display = localFont({
  src: [
    { path: "../(site)/fonts/InterDisplay-500.woff2", weight: "500", style: "normal" },
    { path: "../(site)/fonts/InterDisplay-600.woff2", weight: "600", style: "normal" },
    { path: "../(site)/fonts/InterDisplay-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--ja-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jomiez",
  applicationName: "Jomiez",
  description: "Run jomiez.com from your phone.",
  manifest: "/app/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Jomiez", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/app/icon-192.png", sizes: "192x192" }], apple: [{ url: "/app/apple-touch-icon.png", sizes: "180x180" }] },
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: false, follow: false },
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0d0b0a",
  colorScheme: "dark",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body className="ja-body">{children}</body>
    </html>
  );
}
