import path from "path";
import { fileURLToPath } from "url";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { resendAdapter } from "@payloadcms/email-resend";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig, type Migration } from "payload";
import sharp from "sharp";
import { signedIn } from "./cms/access";
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
import { migrations } from "./cms/migrations";
import { originOf, previewPath, serverUrl } from "./cms/preview";

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
      afterNavLinks: ["/cms/admin/ViewSite#ViewSite"],
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
  // Order sets the admin's sidebar: Inbox, Pages, Content, Settings, Legal.
  collections: [Inquiries, Pages, Projects, Articles, Media, Users],
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
  ],
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || `file:${path.resolve(dirname, "jomiez.db")}`,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    },
    // The schema only ever changes through migrations (cms/migrations), in
    // development and production alike, so the two never drift apart.
    push: false,
    migrationDir: path.resolve(dirname, "cms/migrations"),
    prodMigrations: migrations as Migration[],
  }),
  sharp,
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM || "hello@jomiez.com",
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
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  onInit: async (payload) => {
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
