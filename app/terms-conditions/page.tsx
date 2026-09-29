import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/LegalPage";
import { terms } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that apply when you use the Jomiez Innovation website and services.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="Please read these terms carefully before using the Jomiez Innovation website or engaging us for a project."
      sections={terms}
    />
  );
}
