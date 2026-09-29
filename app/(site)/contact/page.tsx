import type { Metadata } from "next";
import { ContactSplit } from "@/components/sections/contact/ContactSplit";
import { ContactStandard } from "@/components/sections/contact/ContactStandard";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("contact-page");
  return pageMetadata(page.meta, { title: "Contact", description: page.split.lead });
}

export default async function ContactPage() {
  const [page, home, site] = await Promise.all([getGlobal("contact-page"), getGlobal("home"), getGlobal("site")]);
  return (
    <>
      <ContactSplit data={page.split} />
      {page.call.enabled !== false && <ContactStandard data={page.call} site={site} />}
      {page.showFaq !== false && <FaqPanel faq={home.faq} />}
    </>
  );
}
