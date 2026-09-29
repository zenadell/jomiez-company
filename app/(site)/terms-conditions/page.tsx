import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/LegalPage";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("terms");
  return pageMetadata(page.meta, { title: page.title || "Terms & Conditions", description: page.intro });
}

export default async function TermsPage() {
  const [page, site] = await Promise.all([getGlobal("terms"), getGlobal("site")]);
  return <LegalPage data={page} site={site} />;
}
