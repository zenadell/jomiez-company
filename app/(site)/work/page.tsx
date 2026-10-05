import type { Metadata } from "next";
import { Live } from "@/components/cms/live/Live";
import { getGlobal, getProjects } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGlobal("work-page");
  return pageMetadata("/work", page.meta, { title: "Products & Work" });
}

export default async function WorkPage() {
  const [page, home, projects] = await Promise.all([getGlobal("work-page"), getGlobal("home"), getProjects()]);
  return <Live view="work" doc={{ field: "page", global: "work-page" }} props={{ page, home, projects }} />;
}
