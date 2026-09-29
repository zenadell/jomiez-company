import type { Metadata } from "next";
import { ContactSplit } from "@/components/sections/contact/ContactSplit";
import { ContactStandard } from "@/components/sections/contact/ContactStandard";
import { FaqPanel } from "@/components/sections/FaqPanel";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start your project with Jomiez Innovation: custom software, web and mobile apps, and AI integrations.",
};

export default function ContactPage() {
  return (
    <>
      <ContactSplit />
      <ContactStandard />
      <FaqPanel />
    </>
  );
}
