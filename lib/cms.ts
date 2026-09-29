import config from "@payload-config";
import { draftMode } from "next/headers";
import { getPayload, type Where } from "payload";
import { cache } from "react";
import type { Article, Config, Page, Project } from "@/payload-types";

/*
 * How the site reads its content: straight from the database through Payload's
 * Local API, on the server. Everything is published content, unless the page is
 * open in the admin's preview, which shows drafts. Each read happens once per
 * request (React cache).
 */

type Globals = Config["globals"];
export type GlobalSlug = keyof Globals;

export const payloadClient = cache(() => getPayload({ config }));

/** Whether this request is the admin's preview (drafts shown). */
export const isPreview = cache(async () => {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false; // outside a request (sitemap generation at build time)
  }
});

export const getGlobal = cache(async <S extends GlobalSlug>(slug: S): Promise<Globals[S]> => {
  const payload = await payloadClient();
  const draft = await isPreview();
  return (await payload.findGlobal({ slug, draft, depth: 2, overrideAccess: true })) as Globals[S];
});

const published = (draft: boolean): Where | undefined => (draft ? undefined : { _status: { equals: "published" } });

export const getProjects = cache(async (): Promise<Project[]> => {
  const payload = await payloadClient();
  const draft = await isPreview();
  const { docs } = await payload.find({
    collection: "projects",
    draft,
    where: published(draft),
    sort: "_order",
    depth: 1,
    limit: 200,
    pagination: false,
    overrideAccess: true,
  });
  return docs;
});

export const getProject = cache(async (slug: string): Promise<Project | null> => {
  const payload = await payloadClient();
  const draft = await isPreview();
  const { docs } = await payload.find({
    collection: "projects",
    draft,
    where: { and: [{ slug: { equals: slug } }, ...(draft ? [] : [{ _status: { equals: "published" } } as Where])] },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  });
  return docs[0] ?? null;
});

export const getArticles = cache(async (): Promise<Article[]> => {
  const payload = await payloadClient();
  const draft = await isPreview();
  const { docs } = await payload.find({
    collection: "articles",
    draft,
    where: published(draft),
    sort: "-date",
    depth: 1,
    limit: 200,
    pagination: false,
    overrideAccess: true,
  });
  return docs;
});

export const getArticle = cache(async (slug: string): Promise<Article | null> => {
  const payload = await payloadClient();
  const draft = await isPreview();
  const { docs } = await payload.find({
    collection: "articles",
    draft,
    where: { and: [{ slug: { equals: slug } }, ...(draft ? [] : [{ _status: { equals: "published" } } as Where])] },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  });
  return docs[0] ?? null;
});

export const getPage = cache(async (slug: string): Promise<Page | null> => {
  const payload = await payloadClient();
  const draft = await isPreview();
  const { docs } = await payload.find({
    collection: "pages",
    draft,
    where: { and: [{ slug: { equals: slug } }, ...(draft ? [] : [{ _status: { equals: "published" } } as Where])] },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  });
  return docs[0] ?? null;
});

export const getPageSlugs = cache(async (): Promise<string[]> => {
  const payload = await payloadClient();
  const { docs } = await payload.find({
    collection: "pages",
    where: { _status: { equals: "published" } },
    depth: 0,
    limit: 500,
    pagination: false,
    overrideAccess: true,
    select: { slug: true },
  });
  return docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
});

export const getRedirect = cache(async (from: string) => {
  const payload = await payloadClient();
  const { docs } = await payload.find({
    collection: "redirects",
    where: { from: { in: [from, from.replace(/\/$/, ""), `${from.replace(/\/$/, "")}/`] } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  });
  return docs[0] ?? null;
});

export { fill, img, localUrl, src, texts, type Img } from "./media";
