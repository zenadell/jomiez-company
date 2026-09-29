import type { Metadata } from "next";
import { Live } from "@/components/cms/live/Live";
import { getArticles, getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("journal-page");
  return pageMetadata(page.meta, { title: "Journal", description: page.intro });
}

export default async function InsightsPage() {
  const [page, articles] = await Promise.all([getGlobal("journal-page"), getArticles()]);
  return <Live view="journal" doc={{ field: "page", global: "journal-page" }} props={{ page, articles }} />;
}
