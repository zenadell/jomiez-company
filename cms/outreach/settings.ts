import type { Payload } from "payload";
import { decrypt } from "../agent/secrets";
import type { Country, Kind } from "./kinds";
import type { Settings } from "./write";

/** Clients → Settings, with the saved Gmail password and PageSpeed key decrypted (server only). */
export type OutreachSettings = Settings & {
  enabled: boolean;
  searches: { area: string; country: Country; kinds: Kind[]; on: boolean }[];
  dailyNew: number;
  dailyReady: number;
  followUp: boolean;
  followUpDays: number;
  gmail: string;
  gmailPassword: string;
  dailyEmails: number;
  pagespeedKey: string;
  weeklyPost: boolean;
};

export async function loadOutreach(payload: Payload): Promise<OutreachSettings> {
  const g = (await payload.findGlobal({ slug: "outreach", depth: 0, overrideAccess: true, context: { revealAgentKey: true } })) as unknown as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    enabled: g.enabled === true,
    searches: ((g.searches as Record<string, unknown>[] | undefined) ?? [])
      .filter((s) => s?.area)
      .map((s) => ({ area: str(s.area), country: (s.country as Country) || "NG", kinds: ((s.kinds as Kind[]) ?? []).filter(Boolean), on: s.on !== false })),
    dailyNew: num(g.dailyNew, 15),
    dailyReady: num(g.dailyReady, 10),
    offer: str(g.offer) || "A fast, modern website that looks great on phones and shows up on Google, designed and built by Jomiez.",
    senderName: str(g.senderName),
    senderPhone: str(g.senderPhone),
    address: str(g.address),
    previews: g.previews !== false,
    previewScore: num(g.previewScore, 55),
    followUp: g.followUp !== false,
    followUpDays: num(g.followUpDays, 4),
    gmail: str(g.gmail) || str(process.env.GMAIL_USER),
    gmailPassword: decrypt(str(g.gmailPassword)) || str(process.env.GMAIL_APP_PASSWORD),
    dailyEmails: num(g.dailyEmails, 20),
    pagespeedKey: decrypt(str(g.pagespeedKey)) || str(process.env.PAGESPEED_API_KEY),
    weeklyPost: g.weeklyPost === true,
  };
}
