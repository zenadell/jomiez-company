import { Blocks } from "@/components/cms/Blocks";
import type { Article, Home, JournalPage, Page } from "@/payload-types";

export type PageViewProps = { page: Page; home: Home | null; articles: Article[]; journal: JournalPage | null };

/* A custom page built in the admin from the site's own sections. */
export function PageView({ page, home, articles, journal }: PageViewProps) {
  return <Blocks blocks={page.layout ?? []} home={home} articles={articles} journal={journal} />;
}
