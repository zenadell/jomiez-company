import { ContactSplit } from "@/components/sections/contact/ContactSplit";
import { ContactStandard } from "@/components/sections/contact/ContactStandard";
import { FaqPanel } from "@/components/sections/FaqPanel";
import type { ContactPage, Home, Site } from "@/payload-types";

export type ContactViewProps = { page: ContactPage; home: Home; site: Site };

export function ContactView({ page, home, site }: ContactViewProps) {
  return (
    <>
      <ContactSplit data={page.split} />
      {page.call?.enabled !== false && page.call && <ContactStandard data={page.call} site={site} />}
      {page.showFaq !== false && <FaqPanel faq={home.faq} />}
    </>
  );
}
