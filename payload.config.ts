import path from "path";
import { fileURLToPath } from "url";
import { resendAdapter } from "@payloadcms/email-resend";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig, type Migration } from "payload";
import sharp from "sharp";
import { signedIn } from "./cms/access";
import { AgentMemory, AgentRoutines, AgentSettings, AgentThreads } from "./cms/agent/config";
import { Articles } from "./cms/collections/Articles";
import { Inquiries } from "./cms/collections/Inquiries";
import { Media } from "./cms/collections/Media";
import { Pages } from "./cms/collections/Pages";
import { Projects } from "./cms/collections/Projects";
import { Users } from "./cms/collections/Users";
import { Effects } from "./cms/globals/Effects";
import { HomePage } from "./cms/globals/HomePage";
import {
  AboutPage,
  ContactPage,
  JournalPage,
  NotFoundPage,
  PrivacyPage,
  ServicesPage,
  TermsPage,
  WorkPage,
} from "./cms/globals/InnerPages";
import { Navigation } from "./cms/globals/Navigation";
import { SiteSettings } from "./cms/globals/SiteSettings";
import { revalidateAfterDelete, revalidateCollection } from "./cms/hooks";
import { database, migrations } from "./cms/db";
import { originOf, previewPath, serverUrl } from "./cms/preview";
import { cloudinaryConfigured, cloudinaryStorage } from "./cms/storage/cloudinary";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/*
 * The Jomiez admin (Payload CMS), served from the same Next.js app at /admin.
 *
 * Database: SQLite through libSQL. Locally that's the file jomiez.db; in
 * production point DATABASE_URI at a Turso database. Images: the uploads/
 * folder locally, Vercel Blob in production. Email: Resend when
 * RESEND_API_KEY is set, otherwise messages are logged to the console.
 * Everything is explained in ADMIN.md.
 */

const secret = process.env.PAYLOAD_SECRET;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("PAYLOAD_SECRET is not set. Add a long random string to the environment (see ADMIN.md).");
}

const livePreviewGlobals = [
  "home",
  "about",
  "services-page",
  "work-page",
  "journal-page",
  "contact-page",
  "privacy",
  "terms",
  "not-found",
  "navigation",
  "site",
  "effects",
];

export default buildConfig({
  secret: secret || "local-development-secret-change-me",
  // Only pinned when NEXT_PUBLIC_SERVER_URL is set; otherwise the admin trusts
  // the address it is opened at (see cms/preview.ts).
  serverURL: serverUrl || undefined,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " · Jomiez admin",
      icons: [{ rel: "icon", type: "image/png", url: "/icon.png" }],
    },
    dateFormat: "d MMM yyyy, HH:mm",
    avatar: "default",
    components: {
      graphics: { Logo: "/cms/admin/Logo#Logo", Icon: "/cms/admin/Icon#Icon" },
      beforeDashboard: ["/cms/admin/Dashboard#Dashboard"],
      afterNavLinks: ["/cms/admin/agent/AgentNavLink#AgentNavLink", "/cms/admin/ViewSite#ViewSite"],
      // The agent on every admin screen, and its console at /admin/agent.
      providers: ["/cms/admin/agent/AgentDrawer#AgentDrawer"],
      views: { agent: { Component: "/cms/admin/agent/AgentView#AgentView", path: "/agent" } },
    },
    livePreview: {
      url: ({ data, collectionConfig, globalConfig, req }) =>
        `${originOf(req?.headers)}/next/preview?path=${encodeURIComponent(
          previewPath({ collection: collectionConfig?.slug, global: globalConfig?.slug, slug: data?.slug }),
        )}`,
      collections: ["projects", "articles", "pages"],
      globals: livePreviewGlobals,
      breakpoints: [
        { label: "Phone", name: "phone", width: 390, height: 844 },
        { label: "Tablet", name: "tablet", width: 834, height: 1112 },
        { label: "Laptop", name: "laptop", width: 1440, height: 900 },
      ],
    },
  },
  // Order sets the admin's sidebar: Inbox, Agent, Pages, Content, Settings, Legal.
  collections: [Inquiries, AgentThreads, AgentRoutines, AgentMemory, Pages, Projects, Articles, Media, Users],
  globals: [
    HomePage,
    AboutPage,
    ServicesPage,
    WorkPage,
    JournalPage,
    ContactPage,
    Navigation,
    SiteSettings,
    Effects,
    NotFoundPage,
    PrivacyPage,
    TermsPage,
    AgentSettings,
  ],
  editor: lexicalEditor(),
  // Postgres (Supabase) in production, SQLite locally: see cms/db.ts.
  db: database(),
  sharp,
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM || process.env.LEAD_FROM_EMAIL || "hello@jomiez.com",
        defaultFromName: process.env.EMAIL_FROM_NAME || "Jomiez",
      })
    : undefined,
  plugins: [
    seoPlugin({
      collections: ["projects", "articles", "pages"],
      globals: ["home", "about", "services-page", "work-page", "journal-page", "contact-page", "privacy", "terms"],
      uploadsCollection: "media",
      tabbedUI: true,
      generateTitle: ({ doc }) => {
        const d = doc as { name?: string; title?: string };
        return d?.title || d?.name ? `${d.title || d.name} | Jomiez` : "Jomiez";
      },
      generateDescription: ({ doc }) => {
        const d = doc as { summary?: string; excerpt?: string };
        return d?.summary || d?.excerpt || "";
      },
    }),
    redirectsPlugin({
      collections: ["pages", "projects", "articles"],
      redirectTypes: ["301", "302"],
      overrides: {
        labels: { singular: "Redirect", plural: "Redirects" },
        admin: {
          group: "Settings",
          description: "Send old links to new pages (for example after renaming a project).",
        },
        access: { read: signedIn, create: signedIn, update: signedIn, delete: signedIn },
        hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
      },
    }),
    // Images: Cloudinary when its keys are set, else Vercel Blob, else the local uploads/ folder.
    cloudinaryStorage(),
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) && !cloudinaryConfigured,
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  onInit: async (payload) => {
    // The agent's routine clock (long-running servers only; see cms/agent/routines.ts).
    const { startClock } = await import("./cms/agent/routines");
    startClock(payload);
    // Development: bring the database up to date and fill it with the site's
    // content on first run. Production does this before the build instead
    // (npm run cms:prepare), where it can't race between build workers.
    if (process.env.NODE_ENV === "production") return;
    // Next.js can start Payload in several module graphs at once; share one run.
    const g = globalThis as { __jomiezPrepare?: Promise<void> };
    g.__jomiezPrepare ??= (async () => {
      await payload.db.migrate({ migrations: migrations as Migration[] });
      const { seedIfEmpty } = await import("./cms/seed");
      await seedIfEmpty(payload);
    })();
    await g.__jomiezPrepare;
  },
});
