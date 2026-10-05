import { PageHero } from "@/components/sections/PageHero";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { Impact } from "@/components/sections/home/Impact";
import { WorkMosaic } from "@/components/sections/about/WorkMosaic";
import { Story } from "@/components/sections/about/Story";
import { Capabilities } from "@/components/sections/about/Capabilities";
import { img, texts, type Img } from "@/lib/media";
import type { About, Home, Site } from "@/payload-types";

export type AboutViewProps = { about: About; home: Home; site: Site };

export function AboutView({ about, home, site }: AboutViewProps) {
  const shots = (about.mosaic ?? []).map((m) => img(m.image)).filter((i): i is Img => i !== null);
  return (
    <>
      <PageHero title={about.hero?.title} lead={about.hero?.lead} cta={about.hero?.cta}>
        {shots.length > 0 && <WorkMosaic shots={shots} />}
      </PageHero>
      {about.story?.enabled !== false && about.story && <Story data={about.story} stats={site.stats} />}
      {about.crafts?.enabled !== false && about.crafts && <Capabilities data={about.crafts} stack={texts(site.stack)} />}
      {about.showTenets !== false && home.tenets.enabled !== false && <Impact data={home.tenets} />}
      {about.showFaq !== false && <FaqPanel faq={home.faq} />}
    </>
  );
}
