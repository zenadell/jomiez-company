# The Jomiez admin

Everything on jomiez.com (every word, image, link, button, section, page and effect) is edited at **`/admin`**. The admin is [Payload CMS](https://payloadcms.com) running inside this Next.js app, so there's nothing separate to host.

## First time

```bash
npm install
npm run dev
```

Open http://localhost:3000/admin and create your account. The first account is always an **Admin**.

On that first run the database file is created (`jomiez.db`, not committed) and filled with the site's current content, images included. After that, the content lives in the admin; the files in `cms/seed/content/` are only the starting point.

## What's in the admin

| Sidebar | What it controls |
| --- | --- |
| **Inbox** | Messages from the contact form. Mark them *New*, *In progress*, *Replied*, *Archived* or *Spam*, and keep private team notes. The dashboard shows how many are new. |
| **Pages → Home page** | Every home section, one tab each, top to bottom: hero, introduction, Creations, services, philosophy, tenets, image band, four seasons, company, pricing, questions and journal. Each tab has a **Show this section** switch. |
| **Pages → About / Services / Products & work / Journal / Contact** | Those pages' words, images and buttons. The Contact page includes the form's labels, budget options and thank-you message. |
| **Pages → Custom pages** | Brand-new pages at `jomiez.com/<address>`, built by stacking the site's own sections: page opener, text, image band, numbered cards, products & work grid, latest posts, tenets, pricing, questions and a call to action. |
| **Content → Products & work** | Every product and client project. Drag rows to reorder them. Tick **This is one of our own products** to get the full product page (hero, stats, showcase, feature cards, system notes, FAQ). |
| **Content → Journal** | Posts, written in a rich text editor with headings, quotes, lists, links and images. |
| **Content → Media library** | Every image. Replace a file and it changes everywhere it's used. Fill in the description (alt text) for accessibility and search. |
| **Settings → Nav & footer** | The top bar links, the "Hire Us" button, the footer columns, copyright line and the giant glass wordmark. |
| **Settings → Site settings** | Company name, founder (add a portrait here to replace the "T" monogram), stats, client avatars, the tools strip, email, phone, location, social links, the announcement ticker, default search/sharing details, and where contact messages go (plus the automatic reply). |
| **Settings → Effects** | The liquid glass (cursor lens and its size, glass nav, glass footer letters, hero dewdrop), page transitions and smooth scrolling. |
| **Settings → Redirects** | Send old links to new pages, for example after renaming a project. |
| **Settings → Team** | Who can sign in. **Admins** manage everything, including the team and site settings; **Editors** manage content. Five wrong passwords lock an account for 10 minutes. |
| **Settings → Page not found (404)** | The words on the broken-link page. |
| **Legal** | The privacy policy and terms. |

## Drafts, preview and publishing

- Pages, products, posts and the nav **autosave as drafts** while you type. The live site doesn't change until you press **Publish changes**.
- The **eye button** opens a live preview beside the editor, with phone, tablet and laptop sizes. It updates as you type and shows your draft; visitors still see the published version.
- **Versions** keeps up to 50 past versions of each document. Open one to compare it with the current version or restore it.
- Every page has an **SEO** tab for its Google title, description and sharing image.

Publishing takes effect straight away: the site's pages are pre-built for speed, and a publish rebuilds them on the next visit.

## Email (contact form)

Every message is saved to the Inbox. To also get an email for each one, and to send visitors the automatic reply:

1. Create a free account at [resend.com](https://resend.com) and verify the jomiez.com domain.
2. Set `RESEND_API_KEY` (and optionally `EMAIL_FROM`, e.g. `hello@jomiez.com`) in the environment.

Without a key, emails are only written to the server log, and messages still reach the Inbox.

Spam protection: a hidden field that only bots fill in, a check that rejects forms sent faster than a person can type, and a per-address rate limit. Bots see the same thank-you message as people, so they get no signal.

## Going live (Vercel)

The site needs three services in production, all with free tiers:

| What | Service | Environment variables |
| --- | --- | --- |
| Database | [Turso](https://turso.tech) (hosted SQLite) | `DATABASE_URI` (`libsql://…`), `DATABASE_AUTH_TOKEN` |
| Images | Vercel Blob (Vercel → Storage → Blob) | `BLOB_READ_WRITE_TOKEN` (added automatically when you connect the store) |
| Email | Resend | `RESEND_API_KEY`, `EMAIL_FROM` |

Also set **`PAYLOAD_SECRET`** to a long random string (for example the output of `openssl rand -hex 32`). It signs admin logins; keep it secret and never change it once live.

Then import the repository in Vercel (framework preset: Next.js) and deploy. Each build (`npm run build`):

1. brings the database structure up to date (`cms/migrations`),
2. fills the database with the site's content if it's empty, uploading the images to Blob,
3. pre-builds every page.

Then open `https://your-domain/admin` and create the first account.

`NEXT_PUBLIC_SERVER_URL` is optional. Leave it unset and the admin works at whatever address it is opened on (the Vercel link, `www.` or the bare domain). Set it (e.g. `https://jomiez.com`) only to pin the admin to one address.

## Useful commands

```bash
npm run dev              # site + admin at http://localhost:3000 (admin at /admin)
npm run build            # production build (prepares the database first)
npm run seed             # fill an empty database with the site's content
npm run seed:fresh       # wipe products, posts, pages, media and messages, then re-seed
npm run generate:types   # after changing the schema in cms/: refresh payload-types.ts
npm run payload -- migrate:create <name>   # after changing the schema: record a migration
```

## For developers

| Path | What it is |
| --- | --- |
| `payload.config.ts` | The admin: collections, globals, database, email, storage, plugins, live preview |
| `cms/collections/` | Products & work, Journal, Custom pages, Media, Inbox, Team |
| `cms/globals/` | Home, About, Services, Products & work page, Journal page, Contact, Nav & footer, Site settings, Effects, 404, Privacy, Terms |
| `cms/fields.ts` | Shared field builders (links, images, section switches, stats, questions) |
| `cms/hooks.ts` | Rebuild the site's pages when something is published |
| `cms/access.ts` | Who can read and change what (the public site reads through the server only) |
| `cms/migrations/` | Database structure changes, applied automatically |
| `cms/seed/` | The site's original content and the seed that loads it |
| `cms/admin/` | Admin customisations: logo, dashboard, list-row labels, "View the site" link |
| `lib/cms.ts` | How the site reads content (published, or drafts in preview) |
| `app/(site)/` | The public site; `app/(payload)/` is the admin and its API |
| `app/(site)/contact/actions.ts` | The contact form's server side |
| `app/(site)/[...slug]/` | Custom pages and redirects |
| `app/(site)/next/preview/` | Turns on draft preview for signed-in team members |

After changing a schema file in `cms/`, run `npm run generate:types` and create a migration (`npm run payload -- migrate:create <name>`). Commit both.
