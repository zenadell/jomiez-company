import type { Metadata } from "next";
import { Live } from "@/components/cms/live/Live";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getGlobal("about");
  return pageMetadata(about.meta, { title: "About", description: about.hero.lead });
}

export default async function AboutPage() {
  const [about, home, site] = await Promise.all([getGlobal("about"), getGlobal("home"), getGlobal("site")]);
  return <Live view="about" doc={{ field: "about", global: "about" }} props={{ about, home, site }} />;
}
