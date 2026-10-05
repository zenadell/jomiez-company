import type { Metadata } from "next";
import { Live } from "@/components/cms/live/Live";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("services-page");
  return pageMetadata("/services", page.meta, { title: "Services", description: page.hero.lead });
}

export default async function ServicesPage() {
  const [page, home] = await Promise.all([getGlobal("services-page"), getGlobal("home")]);
  return <Live view="services" doc={{ field: "page", global: "services-page" }} props={{ page, home }} />;
}
