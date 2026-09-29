import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { FaqPanel } from "@/components/sections/FaqPanel";
import { Impact } from "@/components/sections/home/Impact";
import { WorkMosaic } from "@/components/sections/about/WorkMosaic";
import { Story } from "@/components/sections/about/Story";
import { Capabilities } from "@/components/sections/about/Capabilities";

export const metadata: Metadata = {
  title: "About",
  description:
    "Jomiez Innovation is a software company founded by Emmanuel Ezinna Nweke (Templeton). We grow our own AI products and build custom software, web and mobile apps and AI systems for businesses.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="We make software meant to outlive the season."
        lead="Jomiez Innovation is a software company. We grow our own products, like Chaka AI and Chaka WAP, and craft custom software, web platforms and AI systems for the businesses we work beside."
        cta={{ label: "Start a project", href: "/contact" }}
      >
        <WorkMosaic />
      </PageHero>
      <Story />
      <Capabilities />
      <Impact />
      <FaqPanel />
    </>
  );
}
