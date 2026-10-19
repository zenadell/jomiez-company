import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Live } from "@/components/cms/live/Live";
import { getGlobal, getProject, getProjects } from "@/lib/cms";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbs, faqPage, project as projectThing } from "@/lib/structured-data";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.filter((p) => p.slug).map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return pageMetadata(`/work/${project.slug}`, project.meta, { title: project.name, description: project.summary, image: project.image });
}

/* A product page or case study (components/views/ProjectView.tsx). */
export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, projects, page, site] = await Promise.all([
    getProject(slug),
    getProjects(),
    getGlobal("work-page"),
    getGlobal("site"),
  ]);
  if (!project) notFound();
  // The product page shows its questions (components/product/ProductPage.tsx); a case study shows none.
  const faq = project.isProduct && project.productPage?.hero?.title ? faqPage((project.productPage?.faq?.items ?? []).map((i) => ({ question: i.q, answer: i.a }))) : null;
  return (
    <>
      <JsonLd things={[projectThing(site, project), breadcrumbs(site, [{ name: "Products & Work", path: "/work" }, { name: project.name, path: `/work/${project.slug}` }]), faq]} />
      <Live
      view="project"
      doc={{ field: "project", collection: "projects", id: project.id }}
      props={{ project, projects, page, site }}
      />
    </>
  );
}
