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
| **Inbox** | Messages from the contact form. Mark them *New*, *In progress*, *Replied*, *Archived* or *Spam*, and keep private team notes. The dashboard shows how many are new. The agent reads each new message as it arrives (see below). |
| **Agent → Conversations** | Everything the agent has worked on, step by step, with every change it made. Open one in the console to continue it or undo it. |
| **Agent → Routines** | Work the agent does on its own on a schedule ("every Monday at 08:00, check the site and brief me"). |
| **Agent → Memory** | What it keeps in mind in every task: facts, your preferences, and lessons from changes you turned down. Edit or delete anything. |
| **Agent → Agent settings** | Its model and key, what it may do on its own, its voice, notifications and limits (admins only). |
| **Pages → Home page** | Every home section, one tab each, top to bottom: hero, introduction, Creations, services, philosophy, tenets, image band, four seasons, company, pricing, questions and journal. Each tab has a **Show this section** switch. |
| **Pages → About / Services / Products & work / Journal / Contact** | Those pages' words, images and buttons. The Contact page includes the form's labels, budget options and thank-you message. |
| **Pages → Custom pages** | Brand-new pages at `jomiez.com/<address>`, built by stacking the site's own sections: page opener, text, image band, numbered cards, products & work grid, latest posts, tenets, pricing, questions and a call to action. Under **Where it appears**, tick *Show in the top menu* and/or *Show in the footer* (and pick the footer column) to link the page from every page of the site. |
| **Content → Products & work** | Every product and client project. Drag rows to reorder them. Tick **This is one of our own products** to get the full product page (hero, stats, showcase, feature cards, system notes, FAQ). |
| **Content → Journal** | Posts, written in a rich text editor with headings, quotes, lists, links and images. |
| **Content → Media library** | Every image. Replace a file and it changes everywhere it's used. Fill in the description (alt text) for accessibility and search. |
| **Settings → Nav & footer** | The top bar links, the "Hire Us" button, the footer columns, copyright line and the giant glass wordmark. Custom pages can also add themselves to the menu and footer (see Custom pages). |
| **Settings → Site settings** | Company name, founder (add a portrait here to replace the "T" monogram), stats, client avatars, the tools strip, email, phone, location, social links, the announcement ticker, default search/sharing details, and where contact messages go (plus the automatic reply). |
| **Settings → Effects** | The liquid glass (cursor lens and its size, glass nav, glass footer letters, hero dewdrop), page transitions and smooth scrolling. |
| **Settings → Redirects** | Send old links to new pages. Renaming the address of a published page, product or post adds one automatically, so old links keep working. |
| **Settings → Team** | Who can sign in. **Admins** manage everything, including the team and site settings; **Editors** manage content. Five wrong passwords lock an account for 10 minutes. |
| **Settings → Page not found (404)** | The words on the broken-link page. |
| **Legal** | The privacy policy and terms. |

## Drafts, preview and publishing

- Pages, products, posts and the nav **autosave as drafts** while you type. The live site doesn't change until you press **Publish changes**.
- The **eye button** opens a live preview beside the editor, with phone, tablet and laptop sizes. It changes as you type, letter by letter, before anything is saved: add a section, switch one off, tick "Show in the top menu" and you see the result at once. Visitors still see the published version until you publish.
- Opening the preview puts your browser in **preview mode**, so the site shows drafts in your other tabs too. A dark bar at the bottom of the page says so; press **Show the live site** to leave it.
- Every **Goes to** box has a **Choose a page** list: every page, section, custom page, product, post and contact link on the site, searchable. You can still type any address.
- On custom pages, each section in the list is named after its own headline, so a long page reads like a table of contents.
- **Versions** keeps up to 50 past versions of each document. Open one to compare it with the current version or restore it.
- Every page has an **SEO** tab for its Google title, description and sharing image.

Publishing takes effect straight away: the site's pages are pre-built for speed, and a publish rebuilds them on the next visit.

## The agent

The admin has its own operator: an AI agent (called **Keeper** until you rename it) that can do anything in the admin you can, on your word or on its own schedule.

**Where it is**

- **The console** (sidebar → *Keeper console*, or `/admin/agent`): ask for anything, watch every step, answer approvals, undo. The bell lists everything it did on its own.
- **On every admin screen**: the round button in the corner opens a chat that knows which page you're on ("tighten this headline" means this one). When it changes that page, the page reloads to show it.
- **The dashboard** shows what it's doing, what's waiting for you and its latest briefing.
- **Out loud**: the microphone button next to *Send* (in the console and in the chat on every screen) starts a live voice conversation. See [Talking to it](#talking-to-it).

**What it can do.** Read and change every page, section, product, journal post, image, link, the nav and footer, search listings, redirects, effects and settings; create pages and posts; publish; bring back earlier versions; add images from the web; read the inbox and write replies; view any page as a visitor sees it; audit the whole site (search listings, image descriptions, broken links, leftover placeholder text); research other websites; hand big reading jobs to a helper; keep a memory; and set up routines. It plans multi-step work in the open and checks its own work.

**Any model.** In *Agent settings → Model*, pick a provider and model: Anthropic (Claude), OpenAI, Google (Gemini), OpenRouter (hundreds of models), Groq, DeepSeek, xAI, Mistral, Together, Ollama on your own machine, or any OpenAI-compatible service.

- Paste the key there (it's stored encrypted and never shown again, not even to the agent) or set it as an environment variable (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, …).
- The model box takes the model's **ID**, exactly as the provider writes it: `deepseek-v4-flash`, not "DeepSeek V4 Flash". **Choose from your account** under the box asks the provider which models your key can use right now and fills in the exact ID, so new models show up the day they're released.
- **Test the connection** checks it. If the name isn't one the provider knows, it says which IDs are closest.
- The quick model (optional) does background work cheaply. It must come from the same provider; a leftover model from another provider is ignored.

### Talking to it

Press the microphone next to *Send* and talk. It answers out loud, and it acts while you talk: "change the home headline to …", "publish it", "what came into the inbox today?".

- It runs on **Gemini Live**. Set it up in *Agent settings → Voice*:
  - **Live model**: `gemini-3.1-flash-live-preview` by default. **Choose from your account** lists the live-audio models your key can use.
  - **Its voice**: Kore by default, or any Gemini voice (Puck, Charon, Fenrir, Aoede, Leda, Orus, Zephyr, …).
  - **Language** (optional): e.g. `en-GB`. Empty means it follows you.
  - **Gemini key for voice**: only needed if neither of these applies: the main provider is Google, or `GEMINI_API_KEY` is set.
- Your key never reaches the browser. Each conversation gets a single-use pass from Google that expires within minutes and is locked to that conversation's model, voice, instructions and actions.
- The same rules apply as for typed requests. Anything that needs your approval shows as a card on screen; it tells you so, and carries on when you click **Approve** or **Decline**. Every change is recorded and can be undone.
- It works like a person at the next desk. "Hold on, let me check" is followed by the check, and then it comes back with what it found; you never have to say "go ahead". It finds the exact spot, changes it, looks at the result and only then tells you.
- It's honest about results. An edit that didn't land (wrong field, wrong page) is a failure, never "done". If it ever says something worked when it didn't, it's corrected on the spot and has to tell you.
- It keeps track of the page it's working on, so "publish it" means that page, and it notices if an edit lands on a different one.
- It starts every conversation knowing where things stand: what's waiting for your approval, what's saved but not live, new inbox messages, and what you asked for in recent conversations.
- **Its voice**: *Agent settings → Voice → Choose a voice* lists Gemini's voices and how each sounds.
- **Talk over it** to interrupt. **Mute** stops it hearing you. The box under the controls lets you type a name or address mid-conversation.
- What you both say is transcribed as you speak and saved as a conversation (◉ in the console). When you press **End**, it opens there: undo its changes, or keep going by typing.
- Long conversations carry on: Google moves a live session to a fresh connection every few minutes, and that happens between sentences, with the conversation intact.
- In the chat on an edit screen, the page doesn't reload mid-conversation when the agent changes it. A button offers the reload, and the page reloads by itself when you press *End*.
- It needs a microphone, the browser's permission to use it, and https (or localhost).

**You stay in charge** (*Agent settings → Permissions*):

| Autonomy | Happens straight away | Waits for your approval |
| --- | --- | --- |
| Ask me before any change | reading, its own notes | every change, even drafts |
| **Draft freely, ask before anything goes live** (default) | drafts, inbox notes | publishing, settings without drafts, redirects, routines, deleting, email |
| Publish on its own | drafts, publishing, settings | deleting, email |
| Full autonomy | everything you allow | whatever you set to *Ask me first* |

- An approval card shows the exact change (before → after, field by field) with **Approve** and **Decline**. Decline with a reason and it remembers the lesson.
- It acts with the permissions of the person who asked (a routine: whoever set it up). It can never manage the team or passwords, change its own settings, or see API keys.
- Every change is recorded with a snapshot of what was there before. In the console, **Undo** next to a change reverses that step, and **Undo all** puts everything from a conversation back.
- **Stop** halts it mid-task; *The agent is on* in settings stops everything at once. Daily limits cap tasks and tokens.

**On its own, and you're always told.**

- **New messages**: each contact-form message is read as it arrives. The agent sorts it (lead, question, spam), writes a summary, what to do next and a suggested reply into the message's notes, and marks obvious spam. It never replies on its own. This runs sealed off: a message is a stranger's words, so while reading one the agent can only read that message and set its status and notes. No other page, no memory, no email, no web.
- **Routines** run on their schedule, in their own time zone.
- **Every** automatic run leaves a notice under the bell and sends you an email: what it did, what it changed, and anything waiting for approval, with a link straight to it (*Agent settings → Automation*; the address falls back to `ADMIN_NOTIFY_EMAIL`, then Site settings). Emails need Resend set up.

Routines need the server's clock: on Render (always-on plan) or any long-running server it checks every minute. On a host that sleeps or on Vercel, have a scheduler call `GET /api/agent/tick` with the header `Authorization: Bearer <CRON_SECRET>`; while anyone has the admin open, due routines also get their chance.

## Email (contact form)

Every message is saved to the Inbox. To also get an email for each one, and to send visitors the automatic reply:

1. Use the Resend account the old portfolio already sends from (jomiez.com is verified there), or create one at [resend.com](https://resend.com) and verify the domain.
2. Set `RESEND_API_KEY` (and `EMAIL_FROM`, e.g. `hello@jomiez.com`) in the environment.

Without a key, emails are only written to the server log, and messages still reach the Inbox.

Spam protection: a hidden field that only bots fill in, a check that rejects forms sent faster than a person can type, and a per-address rate limit. Bots see the same thank-you message as people, so they get no signal.

## Going live (Render, with Supabase, Cloudinary and Resend)

The site runs on the same services as the old portfolio. `render.yaml` describes it; the settings use the same names as the old portfolio, so its values can be copied across (Render → old service → Environment).

| What | Service | Settings |
| --- | --- | --- |
| Hosting | Render (web service, always-on plan) | from `render.yaml` |
| Database | Supabase (Postgres) | `SUPABASE_DATABASE_URL` |
| Images | Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Email | Resend (jomiez.com already verified there) | `RESEND_API_KEY`, `LEAD_FROM_EMAIL` (the sender, as on the old site), `LEAD_REPLY_TO` (optional) |
| The agent and voice | Gemini, or any provider | `GEMINI_API_KEY` (also powers voice), or keys in Agent settings |
| Agent notices | | `ADMIN_NOTIFY_EMAIL` |

`PAYLOAD_SECRET` and `CRON_SECRET` are generated by Render. Keep `PAYLOAD_SECRET` for good: it signs logins and encrypts saved keys.

**The database.** The site keeps all its tables in their own Postgres schema, `jomiez_site`, so it can share the old portfolio's Supabase project without touching its tables. (A new Supabase project works just as well.) Use the connection string from Supabase → Project settings → Database.

**Bring what you built locally.** Everything made in the admin on your computer (custom pages, edits, images, the agent's memory) lives in the local database file, not in the code. To start the live site from it:

```
npm run content:save
git add content-snapshot
git commit -m "Content snapshot"
git push
```

`content:save` writes `content-snapshot/`: every page, product, post, redirect and setting (live and draft), the images, the agent's memory and routines. Never included: logins, API keys, inbox messages and conversation history. The first deploy into the empty Supabase schema loads it instead of the starter content. Run it again just before going live if you keep editing locally. (Loading into a database that already has content is a deliberate step: `npm run content:load -- --yes` with that database's settings.)

**Steps**

1. Save your local content (above), then merge this work into `main`.
2. Render → **New → Blueprint** → choose this repository. Fill in the settings it asks for by copying each value from the old service (Render → old service → Environment): `SUPABASE_DATABASE_URL`, the three `CLOUDINARY_*`, `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_REPLY_TO`, `ADMIN_NOTIFY_EMAIL`. For `GEMINI_API_KEY`, use a **new** key (see below).
3. The first deploy builds the database structure in Supabase, loads your content snapshot (or the starter content), uploads the images to Cloudinary (folder `jomiez-site`) and pre-builds every page. Each later deploy only applies new migrations.
4. Open `https://jomiez-site.onrender.com/admin` (Render shows the exact address), create the first account, and look around. The dashboard's **Going live** panel shows whether the database, images, email, agent and voice are connected; **Send a test email** proves email end to end. API keys saved in the local Agent settings aren't copied: add them again there, or set them on Render. The old site is still live on jomiez.com.
5. **Move the domain.** In the old service → Settings → Custom domains, remove `jomiez.com` and `www.jomiez.com`. In the new service, add both. Render shows the DNS records: the bare domain's A record already points at Render; change the `www` CNAME to the new service's `.onrender.com` address. Render issues the certificates and redirects `www` to the bare domain.
6. Old addresses keep working: `/works`, `/contact-us`, `/blog`, `/testimonials`, `/resume`, `/terms-condition` and the old `.html` pages redirect to their new pages, and the Google Search Console file is kept, so the site stays verified.
7. Optional, once the domain works: set `NEXT_PUBLIC_SERVER_URL=https://jomiez.com` to pin the admin to it.
8. Suspend the old service when you're happy.

**Replace the old Gemini and Groq keys.** The old portfolio's public `/api/chaka/voice-token` address hands its saved Gemini and Groq keys to anyone who asks, so treat them as exposed: create new keys in Google AI Studio (and Groq), use the new ones here, and delete the old ones once the old service is off. The new site never sends a key to the browser.

If the build runs out of memory on the smallest plan, give the service a larger plan for the build (Next.js builds need about 1.5 GB), or turn on Render's larger build machines.

**Elsewhere.** The site also runs on Vercel (`BLOB_READ_WRITE_TOKEN` for images, a Turso or Supabase database, and a Vercel Cron calling `/api/agent/tick` for routines).

## Useful commands

```bash
npm run dev              # site + admin at http://localhost:3000 (admin at /admin)
npm run build            # production build (prepares the database first)
npm run seed             # fill an empty database with the site's content
npm run seed:fresh       # wipe products, posts, pages, media and messages, then re-seed
npm run generate:types   # after changing the schema in cms/: refresh payload-types.ts
npm run payload -- migrate:create <name>   # after changing the schema: record the SQLite migration
SUPABASE_DATABASE_URL=postgres://… npm run payload -- migrate:create <name>   # …and the Postgres one (a local Postgres is fine)
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
| `cms/admin/` | Admin customisations: logo, dashboard, list-row labels, "View the site" link, page picker |
| `cms/agent/` | The agent: settings and records (`config.ts`), models and their lists (`providers.ts`), the run loop with approvals and notices (`run.ts`, `notify.ts`), its tools (`tools.ts`), how it reads and changes documents with undo (`docs.ts`, `diff.ts`), the permission rules (`policy.ts`), its instructions (`prompt.ts`), routines and inbox sorting (`routines.ts`, `triage.ts`), live voice sessions (`voice.ts`) |
| `cms/admin/agent/` | The console, the chat on every screen, approval cards, the dashboard card, the model picker, and voice (`useVoice.ts` for the microphone, playback and the live connection; `Voice.tsx` for its controls) |
| `app/(payload)/api/agent/` | The agent's endpoints (chat, approve, stop, undo, status, models, voice, tick) |
| `cms/db.ts` | Postgres (Supabase) in production, SQLite locally, each with its own migrations |
| `cms/snapshot.ts` | Saving the admin's content to `content-snapshot/` and loading it into another database |
| `cms/setup.ts` | The dashboard's Going live checks |
| `cms/storage/cloudinary.ts` | Images in Cloudinary |
| `render.yaml` | The Render service and its settings |
| `lib/cms.ts` | How the site reads content (published, or drafts in preview) |
| `components/views/` | Every page's content as a plain component of its data: rendered on the server for visitors, and in the browser in live preview |
| `components/cms/live/` | Live preview: follows the edit form as you type (`useLiveDoc`), including the nav, footer, settings and effects |
| `cms/admin/PagePicker.tsx`, `BlockLabel.tsx`, `FooterColumnField.tsx` | The "Choose a page" list, section names on custom pages, the footer column picker |
| `app/(site)/` | The public site; `app/(payload)/` is the admin and its API |
| `app/(site)/contact/actions.ts` | The contact form's server side |
| `app/(site)/[...slug]/` | Custom pages and redirects |
| `app/(site)/next/preview/` | Turns on draft preview for signed-in team members |

After changing a schema file in `cms/`, run `npm run generate:types` and create the migration for both databases (commands above): `cms/migrations` (SQLite, local) and `cms/migrations-pg` (Postgres, production). Commit all of it.
