import type { Metadata } from "next";
import { Live } from "@/components/cms/live/Live";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("contact-page");
  return pageMetadata(page.meta, { title: "Contact", description: page.split.lead });
}

export default async function ContactPage() {
  const [page, home, site] = await Promise.all([getGlobal("contact-page"), getGlobal("home"), getGlobal("site")]);
  return <Live view="contact" doc={{ field: "page", global: "contact-page" }} props={{ page, home, site }} />;
}
