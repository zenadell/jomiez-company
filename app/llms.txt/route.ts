import { getArticles, getGlobal, getProjects } from "@/lib/cms";

/*
 * /llms.txt (llmstxt.org): the site in plain Markdown for AI assistants and
 * answer engines — who Jomiez is, what it makes, and where each thing is
 * explained — all from the admin, so it never drifts from the site.
 */

export const revalidate = 3600;

const line = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export async function GET() {
  const [site, projects, articles] = await Promise.all([getGlobal("site"), getProjects(), getArticles()]);
  const base = site.url.replace(/\/$/, "");
  const products = projects.filter((p) => p.isProduct && p.slug);
  const builds = projects.filter((p) => !p.isProduct && p.slug);
  const facts = [
    site.legalName && site.legalName !== site.name ? `Legal name: ${site.legalName}` : "",
    site.founder?.name ? `Founder: ${site.founder.name}${site.founder.role ? `, ${site.founder.role}` : ""}` : "",
    site.location ? `Based in: ${site.location}` : "",
    site.email ? `Email: ${site.email}` : "",
    site.phone ? `Phone: ${site.phone}` : "",
  ].filter(Boolean);
  const out = [
    `# ${site.name}`,
    "",
    `> ${line(site.description)}`,
    "",
    ...facts.map((f) => `- ${f}`),
    "",
    "## Pages",
    "",
    `- [About](${base}/about): who we are and how we work`,
    `- [Services](${base}/services): custom software, web and mobile applications, AI systems`,
    `- [Products & Work](${base}/work): our own products and what we have built for clients`,
    `- [Journal](${base}/insights): articles`,
    `- [Contact](${base}/contact): start a project`,
    ...(products.length ? ["", "## Our products", "", ...products.map((p) => `- [${p.name}](${base}/work/${p.slug}): ${line(p.summary)}`)] : []),
    ...(builds.length ? ["", "## Client work", "", ...builds.map((p) => `- [${p.name}](${base}/work/${p.slug}): ${line(p.summary)}`)] : []),
    ...(articles.length ? ["", "## Journal", "", ...articles.filter((a) => a.slug).map((a) => `- [${line(a.title)}](${base}/insights/${a.slug}): ${line(a.excerpt)}`)] : []),
    "",
    "## Optional",
    "",
    `- [Privacy policy](${base}/privacy-policy)`,
    `- [Terms](${base}/terms-conditions)`,
    "",
  ];
  return new Response(out.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
