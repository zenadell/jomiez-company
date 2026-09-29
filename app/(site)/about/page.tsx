import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { Impact } from "@/components/sections/home/Impact";
import { WorkMosaic } from "@/components/sections/about/WorkMosaic";
import { Story } from "@/components/sections/about/Story";
import { Capabilities } from "@/components/sections/about/Capabilities";
import { getGlobal, img, texts, type Img } from "@/lib/cms";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getGlobal("about");
  return pageMetadata(about.meta, { title: "About", description: about.hero.lead });
}

export default async function AboutPage() {
  const [about, home, site] = await Promise.all([getGlobal("about"), getGlobal("home"), getGlobal("site")]);
  const shots = (about.mosaic ?? []).map((m) => img(m.image)).filter((i): i is Img => i !== null);

  return (
    <>
      <PageHero title={about.hero.title} lead={about.hero.lead} cta={about.hero.cta}>
        {shots.length > 0 && <WorkMosaic shots={shots} />}
      </PageHero>
      {about.story.enabled !== false && <Story data={about.story} stats={site.stats} />}
      {about.crafts.enabled !== false && <Capabilities data={about.crafts} stack={texts(site.stack)} />}
      {about.showTenets !== false && home.tenets.enabled !== false && <Impact data={home.tenets} />}
      {about.showFaq !== false && <FaqPanel faq={home.faq} />}
    </>
  );
}
