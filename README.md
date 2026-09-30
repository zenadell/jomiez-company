# Jomiez — company website

The official site for **Jomiez Innovation**, a software company that makes its own AI products (Chaka AI, Chaka WAP) and builds custom software for businesses. Built in React with Next.js; the design and motion system is a code rebuild of the Spartan AI Framer template (purchased), and the copy is written in an ancient, natural voice to match the garden imagery.

**Everything on the site is edited in the admin at `/admin`** (Payload CMS, built into this app), and the admin has its own AI agent that can do anything there, on request or on a schedule, under your approval rules. See **[ADMIN.md](ADMIN.md)** for the guide: what each part of the admin controls, drafts and live preview, the agent, the contact inbox, email, and going live.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000, admin at http://localhost:3000/admin
npm run build      # production build (prepares the database, then pre-builds every page)
npm run lint
npm run typecheck
```

Requires Node 20.9 or newer.

## Where things live

| Path | What it is |
| --- | --- |
| `app/(site)/` | Pages: home, `about`, `services`, `work` + `work/[slug]` (our products get the product page; client builds get a case study), `insights` + `insights/[slug]`, `contact` (with its server action), legal pages, custom pages and redirects (`[...slug]`), 404 |
| `app/(payload)/` | The admin (`/admin`) and its API (`/api`) |
| `payload.config.ts`, `cms/` | The admin's configuration: content schema, access rules, migrations, seed, admin customisations (see ADMIN.md) |
| `lib/cms.ts` | How pages read content from the admin |
| `components/views/` | Each page's content as a component of its data (shared by the live site and the admin's live preview) |
| `components/sections/home/` | Homepage sections (Hero, Intro, Work, Services, Mission, Impact, Showcase, Process, Studio, Pricing, FAQ, Insights) |
| `components/ui/` | Shared pieces: `JomiezMark` / `JomiezIcon` (the Jomiez "Z" as a vector, and the full-colour app icon), `Icon` (the template's Phosphor icons), `PixelButton` (the pixel-arrow CTA), `PixelArrow`, `Marquee`, `BigMarquee`, `ScrollText`, `ProgressiveBlur`, `TechMark`, `Appear` motion helpers |
| `components/product/` | The product page (template's "Digital Brain" layout): hero, stats, browser-framed showcase, mockup cards, statement, FAQ |
| `components/layout/` | Nav (with phone menu), reveal footer, Lenis smooth scrolling, page transitions |
| `cms/seed/content/` | The site's original content, loaded into the admin on first run. Edit content in the admin, not here |
| `public/media/` | Optimised images used by the site |
| `scripts/optimize-assets.mjs` | Rebuilds `public/media` from source images |
| `scripts/brand-assets.mjs` | Builds the logo icon, favicon, app icon and Apple touch icon from the master logo in `scripts/brand/` |
| `aethron/` | Aethron's mirror of the Framer template and its copy map. Reference only; excluded from deploys and safe to delete |

### Editing content

Sign in at `/admin`. Every page, section, image, product, journal post, the nav and footer, contact details, SEO and the liquid-glass effects are there, with drafts, live preview and version history. The full map is in [ADMIN.md](ADMIN.md).

## Motion

- **Pixel arrow button** — reproduces the template's Framer component exactly: a 14-frame double-chevron marquee (one 3px column every 205ms), and on hover the tile grows to fill the pill with a spring (0.4s, bounce 0.2) while the arrow holds the full `>>`. Five variants: `primary`, `secondary`, `light`, `primarySmall`, `secondarySmall`.
- Page-load entrances use the template's own spring settings (from its appear-animation config).
- Page transitions match the template's page effect: the old page slides up and out while the new one rises from below (400ms, `cubic-bezier(0.27, 0, 0.51, 1)`), using the View Transitions API.
- The tenets slideshow loops infinitely across the full width, advancing every 5s (0.9s ease-out), with arrows and drag/swipe.
- The four animated feature glyphs (swinging magnifier, two-moon orbit, stepping sliders, region ticker) are rebuilt from the live template component: same artwork, positions, timings and easing.
- Scroll-driven character reveals, parallax image bands, infinite marquees, accordion layouts, a rising footer wordmark and Lenis smooth scrolling.
- Everything respects `prefers-reduced-motion`.

## Things to review before launch

- **Copy voice** — the whole site was rewritten as a product company in an ancient, natural voice ("Where intelligence takes root.", the seven tenets, the four seasons of every build). Give the wording a read, especially the founder quote in the homepage intro.
- **Founder portrait** — the Philosophy section shows a "T" monogram tile. Upload a photo in the admin: Site settings → Company → Founder → Portrait.
- **Contact email** — messages arrive in the admin's Inbox. Add a Resend key to also get an email for each one and send visitors the automatic reply (ADMIN.md → Email).
- **Pricing** — shows "Custom / quoted per milestone" because the template's dollar figures were Spartan's, not Jomiez's.
- **Insights articles** — adapted from the Aethron copy map with unverifiable claims removed; give them a read.
- **Imagery** — project screenshots and client avatars come from jomiez.com; the logo comes from the master file in `scripts/brand/`. Decorative images (hero landscape, footer scene, showcase band, textures, article covers) and the Gemini/OpenAI glyphs are from the purchased template; Claude, Hugging Face and the tech-stack logos are from Simple Icons (CC0).
- **Location** — the contact page says "Enugu, Nigeria & working worldwide" (from the previous site); change it in Site settings → Contact.

## Deploy

Deploys to Render with the old portfolio's services: Supabase (Postgres, in its own `jomiez_site` schema), Cloudinary for images, Resend for email. `render.yaml` describes the service; the step-by-step, including moving jomiez.com across and the redirects from the old site's addresses, is in [ADMIN.md → Going live](ADMIN.md#going-live-render-with-supabase-cloudinary-and-resend). Vercel works too (Vercel Blob for images, Turso or Supabase for the database).
