# Jomiez — company website

The official site for **Jomiez Innovation**, a software company that makes its own AI products (Chaka AI, Chaka WAP) and builds custom software for businesses. Built in React with Next.js; the design and motion system is a code rebuild of the Spartan AI Framer template (purchased), and the copy is written in an ancient, natural voice to match the garden imagery.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all pages are static)
npm run lint
npm run typecheck
```

Requires Node 20.9 or newer.

## Where things live

| Path | What it is |
| --- | --- |
| `app/` | Pages: home, `about`, `services`, `work` + `work/[slug]`, `insights` + `insights/[slug]`, `contact`, legal pages, 404, sitemap, robots |
| `components/sections/home/` | Homepage sections (Hero, Intro, Work, Services, Mission, Impact, Showcase, Process, Studio, Pricing, FAQ, Insights) |
| `components/ui/` | Shared pieces: `JomiezMark` (the logo mark, redrawn from jomiez.com), `Icon` (the template's Phosphor icons), `PixelButton` (the pixel-arrow CTA), `PixelArrow`, `Marquee`, `BigMarquee`, `ScrollText`, `ProgressiveBlur`, `TechMark`, `Appear` motion helpers |
| `components/layout/` | Nav (with phone menu), reveal footer, Lenis smooth scrolling |
| `content/` | **All copy and data.** Edit these files to change the site |
| `public/media/` | Optimised images used by the site |
| `scripts/optimize-assets.mjs` | Rebuilds `public/media` from source images |
| `aethron/` | Aethron's mirror of the Framer template and its copy map. Reference only; excluded from deploys and safe to delete |

### Editing content

- `content/site.ts` — company name, email, phone, socials, stats, nav and footer links
- `content/projects.ts` — products and case studies (add one here and it gets a card and a `/work/<slug>` page; `product: true` marks Jomiez's own products)
- `content/articles.ts` — Insights articles
- `content/services.ts`, `content/standards.ts` (the seven tenets), `content/faq.ts` (also holds pricing tiers), `content/legal.ts`

## Motion

- **Pixel arrow button** — reproduces the template's Framer component exactly: a 14-frame double-chevron marquee (one 3px column every 205ms), and on hover the tile grows to fill the pill with a spring (0.4s, bounce 0.2) while the arrow holds the full `>>`. Five variants: `primary`, `secondary`, `light`, `primarySmall`, `secondarySmall`.
- Page-load entrances use the template's own spring settings (from its appear-animation config).
- The four animated feature glyphs (swinging magnifier, two-moon orbit, stepping sliders, region ticker) are rebuilt from the live template component: same artwork, positions, timings and easing.
- Scroll-driven character reveals, parallax image bands, infinite marquees, accordion layouts, a rising footer wordmark and Lenis smooth scrolling.
- Everything respects `prefers-reduced-motion`.

## Things to review before launch

- **Copy voice** — the whole site was rewritten as a product company in an ancient, natural voice ("Where intelligence takes root.", the seven tenets, the four seasons of every build). Give the wording a read, especially the founder quote in the homepage intro.
- **Founder portrait** — the Mission section shows a "T" monogram tile. Add a photo and swap it in `components/sections/home/Mission.tsx`.
- **Contact form** — there's no email backend yet, so submitting opens the visitor's email app with the message addressed to hello@jomiez.com. Add an API route (e.g. Resend) to send directly.
- **Pricing** — shows "Custom / quoted per milestone" because the template's dollar figures were Spartan's, not Jomiez's.
- **Insights articles** — adapted from the Aethron copy map with unverifiable claims removed; give them a read.
- **Imagery** — project screenshots, client avatars and the logo mark come from jomiez.com. Decorative images (hero landscape, footer scene, showcase band, textures, article covers) and the Gemini/OpenAI glyphs are from the purchased template; Claude, Hugging Face and the tech-stack logos are from Simple Icons (CC0).
- **Location** — the contact page says "Enugu, Nigeria & working worldwide" (from the previous site); update in `components/sections/contact/ContactStandard.tsx` if needed.

## Deploy

Works on Vercel out of the box (import the repo, framework preset: Next.js). `.vercelignore` keeps the `aethron/` reference folder out of the upload.
