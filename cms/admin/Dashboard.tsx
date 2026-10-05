import Link from "next/link";
import { DashboardAgent } from "./agent/DashboardAgent";
import type { Payload } from "payload";
import { SetupStatus } from "./SetupStatus";

type Props = { payload: Payload; user?: { name?: string | null; roles?: string[] | null } | null };

const QUICK = [
  { href: "/admin/globals/home", title: "Home page", text: "Every section, top to bottom" },
  { href: "/admin/globals/navigation", title: "Nav & footer", text: "Links on every page" },
  { href: "/admin/collections/projects", title: "Products & work", text: "Add, edit and reorder" },
  { href: "/admin/collections/articles/create", title: "Write a journal post", text: "Opens a fresh draft" },
  { href: "/admin/collections/media", title: "Media library", text: "Every image on the site" },
  { href: "/admin/globals/site", title: "Site settings", text: "Contact details, socials, SEO" },
  { href: "/admin/globals/effects", title: "Effects", text: "Liquid glass and motion" },
  { href: "/admin/collections/pages/create", title: "New page", text: "Build one from sections" },
];

/*
 * The first thing the team sees after signing in: new messages waiting in
 * the inbox and one-click routes to everything they're likely to change.
 */
export async function Dashboard({ payload, user }: Props) {
  const [fresh, projects, articles] = await Promise.all([
    payload.count({ collection: "inquiries", where: { status: { equals: "new" } } }),
    payload.count({ collection: "projects" }),
    payload.count({ collection: "articles" }),
  ]);
  const first = user?.name?.split(" ")[0];

  return (
    <div className="jomiez-dash">
      <DashboardAgent />
      {user?.roles?.includes("admin") && <SetupStatus payload={payload} />}
      <p className="jomiez-dash__hello">{first ? `Welcome back, ${first}.` : "Welcome back."}</p>
      <p className="jomiez-dash__sub">
        Every word, image and link on jomiez.com lives here. Publish a change and the site updates within seconds.
      </p>
      <div className="jomiez-dash__grid">
        <Link className="jomiez-dash__card jomiez-dash__card--accent" href="/admin/collections/inquiries?where[status][equals]=new">
          <span className="jomiez-dash__count">{fresh.totalDocs}</span>
          <strong>{fresh.totalDocs === 1 ? "New message" : "New messages"}</strong>
          <span>From the contact form</span>
        </Link>
        <Link className="jomiez-dash__card" href="/admin/collections/projects">
          <span className="jomiez-dash__count">{projects.totalDocs}</span>
          <strong>Products & projects</strong>
          <span>On the site at /work</span>
        </Link>
        <Link className="jomiez-dash__card" href="/admin/collections/articles">
          <span className="jomiez-dash__count">{articles.totalDocs}</span>
          <strong>Journal posts</strong>
          <span>On the site at /insights</span>
        </Link>
        {QUICK.map((q) => (
          <Link key={q.href} className="jomiez-dash__card" href={q.href}>
            <strong>{q.title}</strong>
            <span>{q.text}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
