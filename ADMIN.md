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
| **Agent → Agent settings** | Its model and your providers' keys, what it may do on its own, its voice, notifications and limits (admins only). A button at the top goes back to the conversation you were in. |
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

**Sight and images.** It can see, not just read:

- **Screenshots** of any page, on this site or another, desktop or phone size, then it looks at them. It checks its own work visually ("is anything overlapping in the footer?") and can show you a design it's asked about. Screenshots appear in the conversation.
- **Look** at any image (one in the media library, a screenshot, or any image address) to pick the right one or describe it properly.
- **Find the images** on any web page, e.g. "use the Checkers image from my old site": it opens the page, lists the pictures by the nearest heading, looks at the likely one and adds the original file to the media library.
- **Free photos** that are safe for a business site: public-domain images, or Pexels with `PEXELS_API_KEY`.
- **Make images** with Gemini, in the site's natural, ancient style. They belong to Jomiez, so there's no licence question.

It won't put images from Pinterest, Google Images or other people's sites on the public site: they belong to their creators.

Seeing images uses Gemini first (the Google key in Your providers, the Voice tab's key, or `GEMINI_API_KEY`); if Gemini fails (for example its account is out of credit) or there's no Gemini key, the main model looks instead (Claude, GPT, Gemini and DeepSeek can all see). When something fails, the agent says which service and why. Making images needs Gemini. *Agent settings → Sight & images* can pin the models. The browser is a fresh, empty one each time (never signed in), and it refuses private and internal addresses.

On a Linux server the browser (about 60 MB) is downloaded the first time a screenshot is needed. It needs about 300 MB of memory on top of the site, so on a server with less than 1.5 GB (Render's Free and Starter plans) the site doesn't start one. Screenshots are taken by a screenshot service instead (Microlink): free without an account, but its daily allowance is small and shared by every site on the same server address, so it can run out. For dependable screenshots there, make a free Browserless account and set `BROWSER_WS_ENDPOINT` to `wss://production-sfo.browserless.io?token=<your token>` (or set `MICROLINK_API_KEY` for a paid Microlink plan), or use Render's Standard plan (2 GB). Without a browser, finding the images on a page reads its HTML (images a page adds later with JavaScript are missed). On your Mac it uses Google Chrome (or set `BROWSER_EXECUTABLE_PATH`).

**Any model, several providers at once.** Anthropic (Claude), OpenAI, Google (Gemini), OpenRouter (hundreds of models), Groq, DeepSeek, xAI, Mistral, Together, Ollama on your own machine, or any OpenAI-compatible service.

- **Your providers** (*Agent settings → Model*): press **Add Provider** for each one you use and paste its key (stored encrypted, never shown again, not even to the agent). Each can also have a quick model: a cheaper one from the same provider for background work. A provider whose key is in the environment (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, …) works without a row.
- **Switching**: click the model name at the top of the console. It lists every provider with a key, and the models each key can use, read live from the provider. Pick one and the agent uses it from the next message, in the same conversation. (The **Provider** and **Model** boxes in settings do the same.)
- The model is always an **ID**, exactly as the provider writes it: `deepseek-v4-flash`, not "DeepSeek V4.1 Flash" (DeepSeek's API keeps the same ID as it releases newer versions). Picking from the list avoids guessing; **Choose from your account** under the Model box does the same.
- **Test the connection** checks the model in use. If the name isn't one the provider knows, it says which IDs are closest.
- The Google key in Your providers also powers voice and seeing images, unless the Voice tab has its own.

### Talking to it

Press the microphone next to *Send* and talk. It answers out loud, and it acts while you talk: "change the home headline to …", "publish it", "what came into the inbox today?".

- It runs on **Gemini Live**. Set it up in *Agent settings → Voice*:
  - **Live model**: `gemini-3.1-flash-live-preview` by default. **Choose from your account** lists the live-audio models your key can use.
  - **Its voice**: Kore by default, or any Gemini voice (Puck, Charon, Fenrir, Aoede, Leda, Orus, Zephyr, …).
  - **Language** (optional): e.g. `en-GB`. Empty means it follows you.
  - **Gemini key for voice**: only needed if Your providers has no Google key and `GEMINI_API_KEY` isn't set.
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

Routines need the server's clock: while the server is running it checks every minute. A server that sleeps (Render's free plan) or Vercel needs a scheduler calling `GET /api/agent/tick` with the header `Authorization: Bearer <CRON_SECRET>` (set up in *Going live → On the free plan*); while anyone has the admin open, due routines also get their chance.

## The phone app

**www.jomiez.com/app** is the agent on your phone: ask it things, send it photos, approve or decline its changes, talk to it, and get a notification when it needs you. It works on iPhone and Android, and installs like an app.

**Install it**
- **iPhone**: open www.jomiez.com/app in Safari, tap **Share** (the box with an arrow), then **Add to Home Screen**. Open it from the icon from then on.
- **Android**: open it in Chrome and tap **Install** on the card at the top (or ⋮ → *Install app*).
- Sign in with your admin account. With **Stay signed in on this phone** on, it stays signed in for 90 days, until you sign out from its settings. (The admin itself signs you out after 8 hours.)

**Using it**
- Type in the message box on the first screen to start a conversation; tap one in the list to reopen it. Swipe from the left edge, or tap **‹**, to go back.
- **+** in the message box adds photos from the camera or the library. The agent looks at them, and can add one to the media library and use it on the site ("put this photo on the About page"). Photos you send are kept for a short while only, not stored in the library unless it adds them.
- Approval cards show the exact change, with big **Approve** and **Decline** buttons. **⋯** in a conversation lists every change it made, each with **Undo**.
- The microphone (in an empty message box) starts a voice conversation, the same as in the admin. It needs a working Gemini key.
- Tap the status under its name to switch models (admins). Your initial, top right, opens the settings.
- Pull the list down to refresh it. The bell lists what it did on its own.

**Notifications** (Settings → *Notifications*):
- You get one when a routine or a new contact message needs your approval or has been dealt with, and when a task you left running finishes or needs you (lock the phone mid-task and it tells you when it's done).
- On iPhone they need iOS 16.4 or later and the app added to the Home Screen; turn them on from inside the installed app.
- There's nothing to set up: the site makes its own notification keys the first time. To use your own, set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (generate a pair with `npx web-push generate-vapid-keys`).

The app opens instantly and offline (it keeps its own copy); conversations always come fresh from the site. On the free plan, the first open after a quiet spell takes up to a minute while the server wakes.

## Finding clients

Keeper looks for businesses that could use a better website, checks their sites, and writes a message to each. **You send every message yourself**, from the phone app. Everything here is free.

**Set it up (once):** Admin → Clients → **Finding clients**.
1. Under **Where to look**, list areas (“Lekki Phase I, Lagos”, “Wuse, Abuja”, “Peckham, London”, “Houston, Texas”) and the kinds of business for each. Areas take turns. Name a neighbourhood rather than a whole county: “Lekki, Lagos” matches Ibeju-Lekki, a huge and mostly rural area, and only its middle gets searched.
2. Write **What you offer** in your words (a starting price if you like). Keeper only promises what's written there.
3. Fill in your name, WhatsApp number (for the “Get this website” button on previews) and business address (it goes at the end of emails).
4. Tick **Look for new clients every day**, and **Write a journal post every week** if you want the weekly SEO post. Save. Both show up under Agent → Routines.
5. Optional but recommended:
   - **Website checks**: a free Google PageSpeed key ([get one](https://developers.google.com/speed/docs/insights/v5/get-started), 25,000 checks a day) adds speed scores and a screenshot of each site. Without it, Keeper does a simpler check of its own.
   - **Email** goes from your own Gmail, 20 a day at most. The site's own email service (Resend) doesn't allow messages people didn't ask for. Render's free plan blocks the ports a Gmail password needs, so use the small Google Script shown in **Email**:
     1. Paste it into [script.google.com](https://script.google.com/home/projects/create).
     2. Set a password in it and type the same password in Jomiez.
     3. Deploy it as a Web app (Execute as: Me, Who has access: Anyone), paste the /exec address, save, and press **Send me a test email**.

     On a host with email ports open, a Gmail app password ([myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)) works too.

**Each morning** Keeper:
- finds new businesses on OpenStreetMap (named businesses with a phone or email; chains are left out);
- checks each website on a phone: does it open, is it secure, is it made for phones, can Google read it, is it dated, can you call or WhatsApp from it;
- gives each a score;
- writes a WhatsApp message, a text and an email for the best ones, using only what it actually found;
- makes a free **homepage preview** for the most promising ones, at jomiez.com/preview/…;
- writes one follow-up for anyone who hasn't replied after a few days.

**What a preview is made of.** Each one is built from the business's own things, so it looks like theirs, not a template:
- their **logo** and **brand colours** (read from the logo), their **photos**, and, for shops, their **products with names and prices**, each with an "Ask about this" WhatsApp button;
- a **street map** with a pin in their colour (only when their map listing or address agrees on where they are), their **opening hours** and an "Open now" badge in their time zone;
- every button uses **their** number: WhatsApp when it's a mobile, a call otherwise.
- Keeper writes the words from what their listing and website say; it never invents reviews, awards, years or prices. Free stock photos (credited at the bottom) fill in only when they have fewer than two photos of their own.
- One of three looks fits the kind of business: warm and elegant (shops, food, beauty), dark and bold (gyms, cars, events, trades), or light and calm (clinics, schools, professionals).
- With Cloudinary set up, the pictures and map are copied there; otherwise the site fetches and shrinks them itself. Maps are drawn from OpenStreetMap and credited on the map.

**In the phone app**, the home screen shows “N messages to send”.
- Tap it to read each message, edit it or ask for a rewrite.
- Then tap **WhatsApp** or **Text**: your phone opens with the message filled in, and you press send. **Email** sends from your Gmail.
- Under **Sent** and **Replied**, keep track: replied, won, not interested.
- When a business opens its preview, you get a notification: a good moment to follow up.

**Asking Keeper:** you can also ask it directly, e.g. “Find 10 salons in Lekki that need a website”, “Rewrite the message to Mama Put Kitchen, shorter”, “Add Glow Studio, 0809 555 1212, to leads”.

**People who say no:**
- Every message ends with a way to opt out (reply “stop”; emails also have a link).
- Mark it with **They asked not to be contacted**, or they use the email or preview link themselves.
- Either way, that business is never contacted again, even if its lead is deleted.

Keep volumes human: a few personal messages a day get replies and keep your WhatsApp and Gmail in good standing.

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
| Hosting | Render (web service, free plan) | from `render.yaml` |
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
2. Render → **New → Blueprint** → choose this repository (a new Render account works: values are copied by hand). Fill in the settings it asks for by copying each value from the old service (Render → old service → Environment): `SUPABASE_DATABASE_URL`, the three `CLOUDINARY_*`, `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_REPLY_TO`, `ADMIN_NOTIFY_EMAIL`. For `GEMINI_API_KEY`, use a **new** key (see below).
3. The first deploy builds the database structure in Supabase, loads your content snapshot (or the starter content), uploads the images to Cloudinary (folder `jomiez-site`) and pre-builds every page. Each later deploy only applies new migrations.
4. Open `https://jomiez-site.onrender.com/admin` (Render shows the exact address), create the first account, and look around. The dashboard's **Going live** panel shows whether the database, images, email, agent and voice are connected; **Send a test email** proves email end to end. API keys saved in the local Agent settings aren't copied: add them again there, or set them on Render. The old site is still live on jomiez.com.
5. **Move the domain.** In the old service → Settings → Custom domains, remove `www.jomiez.com` and `jomiez.com` (a domain can only be on one service). In the new service, add **`www.jomiez.com`**: it's the old site's main address, the one Google knows, so every address stays exactly the same. Render adds `jomiez.com` too and redirects it to `www`, as the old site did. At your domain's DNS: the bare domain's A record already points at Render; change the `www` CNAME to the new service's `.onrender.com` address. Render issues the certificates.
6. **Site settings → URL** must be `https://www.jomiez.com` (the content snapshot already says so). It's the address in every page's canonical link, the sitemap and sharing previews; the dashboard's Going live panel shows it.
7. Old addresses keep working: `/works`, `/contact-us`, `/blog`, `/services/…`, `/testimonials`, `/resume`, `/terms-condition`, the old `.html` pages and the old project pages (`/work/zyro-saas-landing`, `/work/chaka.jomiez`, …) redirect permanently to their new pages, and the Google Search Console file is kept, so the site stays verified.
8. In Google Search Console, submit `https://www.jomiez.com/sitemap.xml` (see *Keeping the search ranking*).
9. Optional, once the domain works: set `NEXT_PUBLIC_SERVER_URL=https://www.jomiez.com` to pin the admin to it.

**Keeping the search ranking.** Search engines rank addresses on a domain, not the server behind them, so pointing `www.jomiez.com` at the new site carries the ranking over as long as the addresses keep working. They do: the main pages keep their addresses, and each of the old site's 24 sitemap addresses either exists or redirects permanently (308) to its new page, which passes its ranking on. Every page names its address on `www.jomiez.com` as canonical, so the `.onrender.com` copy and any other copy don't compete with it. After the switch, submit the sitemap in Search Console and use **URL inspection → Request indexing** on the home page. The pages' words are new, so expect positions for particular searches to move for a few weeks while Google reads them again.

**The old portfolio on its own address.** It can keep running on the old Render service under a subdomain, e.g. `portfolio.jomiez.com`: in the old service → Custom domains, add it; at your DNS, add a CNAME `portfolio` → the old service's `.onrender.com` address. It builds its canonical links, sitemap and robots file from the address it's visited at, so it will present itself as `portfolio.jomiez.com` with no change, and start as a new site in search. Two things to change there:

- **Its exposed keys.** The old site's `/api/chaka/voice-token` hands its Gemini and Groq keys to anyone who asks, and it stays online. Remove those keys from the old service (its voice assistant stops), or give it its own new keys you're willing to expose, with tight limits. Never give it the new site's key.
- **Its wording.** It still presents itself as Jomiez Innovation, so it will compete with the new site in searches for "Jomiez". As a personal portfolio, retitle it around your name.

**Replace the old Gemini and Groq keys.** The old portfolio's public `/api/chaka/voice-token` address hands its saved Gemini and Groq keys to anyone who asks, so treat them as exposed: create new keys in Google AI Studio (and Groq), use the new ones here, and delete the old ones (see above if the old site stays online). The new site never sends a key to the browser.

### On the free plan

`render.yaml` creates the service on Render's free plan: 512 MB of memory and a tenth of a CPU. The site fits (about 330 MB at its busiest, with the admin, live preview and the agent all in use), and builds run on Render's own build machines (8 GB), whatever the plan. What free means:

- **It sleeps after 15 minutes without visitors**, and the next visitor waits about a minute while it wakes. While asleep, the agent's routines don't run. The fix is a free scheduler that calls the site every 10 minutes, which keeps it awake and runs routines on time:
  1. Make a free account at [cron-job.org](https://cron-job.org) → **Create cronjob**.
  2. URL: `https://www.jomiez.com/api/agent/tick` (or the `.onrender.com` address until the domain moves). Schedule: every 10 minutes.
  3. Under **Advanced → Headers**, add `Authorization` with the value `Bearer ` followed by the `CRON_SECRET` from Render → the service → Environment.
  4. Save, then **Test run**: it should answer `200` with `{"ok":true}` (due routines then run in the background). A `401` means the header's secret doesn't match.
- **Free hours.** Render gives each workspace 750 free hours a month, enough for one service awake all month. Keep the new site in its own Render account (or workspace) if the old portfolio is a free service that stays on: two always-on free services in one workspace run out of hours and Render pauses both until the next month.
- **Restarts.** Render may restart a free service at any time, and its disk starts over each time. Nothing is lost: content is in Supabase, images in Cloudinary, and each page is rebuilt from the database on its first visit after a start, so what you published is what visitors see.
- **Speed.** Pages visitors see are cached and fast; the first visit to each page after a restart takes a few seconds while it's built. Photos are resized by Cloudinary, not the server. The admin is usable but slower than on your computer (a few seconds per screen), most of all just after it wakes.
- **Screenshots** go through a free screenshot service on this plan, with a small shared daily allowance; a free Browserless account makes them dependable (see *Sight and images*).
- **Build minutes.** The free workspace includes 500 build minutes a month; each deploy takes a few, so dozens of deploys a month are fine.

**When to upgrade.** Starter ($7 a month) has the same memory but five times the CPU and never sleeps (no scheduler needed for that, though routines still benefit from it). Standard (2 GB) also runs the screenshot browser on the server: there, change the start command's `--max-old-space-size=320` to `1536`. Change the plan under the service's Settings → Instance type.

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
| `cms/agent/eyes.ts` | The agent's browser (screenshots, finding images), seeing images, making them, and free photos |
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
