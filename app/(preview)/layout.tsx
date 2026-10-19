import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./preview.css";

/*
 * Homepage previews (/preview/…): a free sample website Jomiez made for a
 * business, linked from a message to them (cms/outreach). Their own root
 * layout, with none of the Jomiez site's chrome, and never in search results.
 */

const display = localFont({
  src: [
    { path: "../(site)/fonts/InterDisplay-400.woff2", weight: "400", style: "normal" },
    { path: "../(site)/fonts/InterDisplay-500.woff2", weight: "500", style: "normal" },
    { path: "../(site)/fonts/InterDisplay-600.woff2", weight: "600", style: "normal" },
    { path: "../(site)/fonts/InterDisplay-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--pv-font",
  display: "swap",
});

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body className="pv-body">{children}</body>
    </html>
  );
}
