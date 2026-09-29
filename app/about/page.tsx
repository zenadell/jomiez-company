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
    "Jomiez Innovation is a software engineering and AI studio founded by Emmanuel Ezinna Nweke (Templeton), building custom software, web and mobile apps, and production AI systems.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="We engineer the software and AI systems ambitious businesses run on."
        lead="Jomiez Innovation is a software engineering and AI studio. We build custom applications, web platforms and production-ready intelligent systems, from scalable cloud backends to modern interfaces."
        cta={{ label: "Get started", href: "/contact" }}
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
