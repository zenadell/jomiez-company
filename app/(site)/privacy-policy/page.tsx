import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/LegalPage";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("privacy");
  return pageMetadata(page.meta, { title: page.title || "Privacy Policy", description: page.intro });
}

export default async function PrivacyPolicyPage() {
  const [page, site] = await Promise.all([getGlobal("privacy"), getGlobal("site")]);
  return <LegalPage data={page} site={site} />;
}
