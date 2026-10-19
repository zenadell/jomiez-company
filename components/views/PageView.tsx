import { Blocks } from "@/components/cms/Blocks";
import type { Article, Home, JournalPage, Page } from "@/payload-types";

export type PageViewProps = { page: Page; home: Home | null; articles: Article[]; journal: JournalPage | null };

/* A custom page built in the admin from the site's own sections. */
export function PageView({ page, home, articles, journal }: PageViewProps) {
  const blocks = page.layout ?? [];
  // A page opener carries the page's heading; without one, the page still gets one (for search engines and screen readers).
  const heading = blocks.some((b) => b.blockType === "pageHero");
  return (
    <>
      {!heading && <h1 className="sr-only">{page.title}</h1>}
      <Blocks blocks={blocks} home={home} articles={articles} journal={journal} />
    </>
  );
}
