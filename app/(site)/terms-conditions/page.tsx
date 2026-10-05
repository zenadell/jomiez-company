import type { Metadata } from "next";
import { Live } from "@/components/cms/live/Live";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("terms");
  return pageMetadata("/terms-conditions", page.meta, { title: page.title || "Terms & Conditions", description: page.intro });
}

export default async function TermsPage() {
  const [page, site] = await Promise.all([getGlobal("terms"), getGlobal("site")]);
  return <Live view="legal" doc={{ field: "page", global: "terms" }} props={{ page, site }} />;
}
