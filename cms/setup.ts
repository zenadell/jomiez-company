import type { Payload } from "payload";
import { missingSetup } from "./agent/providers";
import { loadConfig, voiceKey } from "./agent/run";
import { databaseUrl, usesPostgres } from "./db";
import { aethronStatus } from "./sites/aethron";
import { previewOrigin } from "./sites/serve";
import { storeName } from "./sites/storage";
import { cloudinaryConfigured } from "./storage/cloudinary";

/*
 * Is everything connected? One line per service the site depends on, for the
 * dashboard's "Going live" panel. Only says whether each is set up, never the
 * values.
 */

export type SetupRow = { name: string; ok: boolean; warn?: boolean; text: string };


export async function setupStatus(payload: Payload): Promise<SetupRow[]> {
  const live = process.env.NODE_ENV === "production";
  const rows: SetupRow[] = [];

  rows.push(
    usesPostgres
      ? { name: "Database", ok: true, text: "Supabase (Postgres), in its own jomiez_site schema." }
      : databaseUrl
        ? { name: "Database", ok: true, text: "Turso (libSQL)." }
        : {
            name: "Database",
            ok: !live,
            warn: live,
            text: live ? "A file on the server, which Render wipes on every deploy. Set SUPABASE_DATABASE_URL." : "The local file jomiez.db (fine on this computer).",
          },
  );

  rows.push(
    cloudinaryConfigured
      ? { name: "Images", ok: true, text: `Cloudinary (${process.env.CLOUDINARY_CLOUD_NAME}), folder ${process.env.CLOUDINARY_FOLDER || "jomiez-site"}.` }
      : process.env.BLOB_READ_WRITE_TOKEN
        ? { name: "Images", ok: true, text: "Vercel Blob." }
        : {
            name: "Images",
            ok: !live,
            warn: live,
            text: live ? "The server's own disk, which Render wipes on every deploy. Set the three CLOUDINARY_ values." : "The local uploads folder (fine on this computer).",
          },
  );

  const from = (process.env.EMAIL_FROM || process.env.LEAD_FROM_EMAIL || "").trim();
  rows.push(
    process.env.RESEND_API_KEY
      ? { name: "Email", ok: true, text: `Resend, sending as ${from || "hello@jomiez.com"}. Send a test to be sure the domain is verified.` }
      : { name: "Email", ok: false, warn: live, text: "Not set: messages still reach the Inbox, but no emails go out. Set RESEND_API_KEY and LEAD_FROM_EMAIL." },
  );

  const secret = process.env.PAYLOAD_SECRET ?? "";
  rows.push(
    secret.length >= 32
      ? { name: "Sign-in secret", ok: true, text: "Set." }
      : { name: "Sign-in secret", ok: !live, warn: live, text: live ? "Too short: use a long random value (Render can generate one)." : "Development value." },
  );

  const site = (await payload.findGlobal({ slug: "site", depth: 0, overrideAccess: true }).catch(() => null)) as { url?: string } | null;
  const url = process.env.NEXT_PUBLIC_SERVER_URL || site?.url || "";
  rows.push(
    /^https:\/\//.test(url)
      ? { name: "Web address", ok: true, text: `${url} (Site settings → URL; used in emails and search listings).` }
      : { name: "Web address", ok: false, warn: live, text: "Set the site's address in Site settings (e.g. https://jomiez.com)." },
  );

  const cfg = await loadConfig(payload);
  const problem = missingSetup({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL });
  rows.push(
    !cfg.enabled
      ? { name: "Agent", ok: false, text: "Switched off in Agent settings." }
      : problem
        ? { name: "Agent", ok: false, text: problem }
        : { name: "Agent", ok: true, text: `${cfg.name} on ${cfg.model}.` },
  );
  rows.push(
    cfg.voice.enabled && voiceKey(cfg)
      ? { name: "Voice", ok: true, text: `Gemini Live (${cfg.voice.model}), voice ${cfg.voice.voiceName}.` }
      : { name: "Voice", ok: false, text: cfg.voice.enabled ? "Needs a Gemini key (Agent settings → Voice, or GEMINI_API_KEY)." : "Switched off." },
  );

  // Previews made from templates (cms/sites).
  const aethronNow = aethronStatus();
  rows.push(
    aethronNow.mode === "hosted"
      ? { name: "Aethron", ok: true, text: `Hosted at ${aethronNow.where}.` }
      : aethronNow.ready
        ? { name: "Aethron", ok: true, text: `Connected through the runner on ${"runner" in aethronNow && aethronNow.runner.connected ? aethronNow.runner.name : "the Mac"}.` }
        : { name: "Aethron", ok: false, text: "Not connected: previews are made with our own design until the Aethron runner runs on the Mac (ADMIN.md → Previews from templates)." },
  );
  rows.push(
    storeName() === "supabase"
      ? { name: "Template previews' files", ok: true, text: "Supabase Storage (bucket previews)." }
      : { name: "Template previews' files", ok: !live, warn: live, text: live ? "The server's own disk, which Render wipes on every deploy. Set SUPABASE_SERVICE_ROLE_KEY." : "The local uploads folder (fine on this computer)." },
  );
  const own = previewOrigin();
  rows.push(
    own
      ? { name: "Preview address", ok: true, text: `${own.origin}: template previews open there, away from the admin.` }
      : { name: "Preview address", ok: false, warn: live, text: "Not set: template previews open in a browser sandbox on this address. Set PREVIEW_SITES_HOST (e.g. preview.jomiez.com) for them to work fully." },
  );

  const snapshot = await payload.kv.get<{ savedAt: string; loadedAt: string }>("content:snapshot").catch(() => null);
  if (snapshot) {
    rows.push({ name: "Content", ok: true, text: `Brought over from your content snapshot of ${new Date(snapshot.savedAt).toLocaleString("en-GB")}.` });
  }
  return rows;
}
