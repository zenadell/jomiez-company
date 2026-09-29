import type { Metadata } from "next";
import { Live } from "@/components/cms/live/Live";
import { getArticles, getGlobal, getProjects } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getGlobal("home");
  return pageMetadata(home.meta);
}

/* The home page (components/views/HomeView.tsx), from the admin's Home page. */
export default async function HomePage() {
  const [home, projects, articles, journal] = await Promise.all([
    getGlobal("home"),
    getProjects(),
    getArticles(),
    getGlobal("journal-page"),
  ]);
  return <Live view="home" doc={{ field: "home", global: "home" }} props={{ home, projects, articles, journal }} />;
}
