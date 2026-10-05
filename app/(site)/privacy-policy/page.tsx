import type { Metadata } from "next";
import { Live } from "@/components/cms/live/Live";
import { getGlobal } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("privacy");
  return pageMetadata("/privacy-policy", page.meta, { title: page.title || "Privacy Policy", description: page.intro });
}

export default async function PrivacyPolicyPage() {
  const [page, site] = await Promise.all([getGlobal("privacy"), getGlobal("site")]);
  return <Live view="legal" doc={{ field: "page", global: "privacy" }} props={{ page, site }} />;
}
