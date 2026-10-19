import { jsonLd } from "@/lib/structured-data";

/* Structured data for search engines and AI assistants (lib/structured-data.ts). */
export function JsonLd({ things }: { things: Parameters<typeof jsonLd>[0] }) {
  if (!things.some(Boolean)) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(things) }} />;
}
