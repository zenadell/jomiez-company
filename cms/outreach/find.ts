import type { Payload } from "payload";
import { COUNTRIES, KINDS, plainKind, tidyPhone, type Country, type Kind } from "./kinds";

/*
 * Finding businesses on OpenStreetMap: free, open data (© OpenStreetMap
 * contributors, ODbL). The area is looked up once with Nominatim (kept for a
 * month, as its rules ask), then Overpass lists the named businesses of each
 * chosen kind (one small query per kind, so a busy map service still answers)
 * that give a phone number or an email address. Chains (anything with a brand,
 * or a well-known chain's name) are left out: they don't buy websites from us.
 */

const UA = "JomiezAgent/1.0 (+https://jomiez.com)";
const OVERPASS = [process.env.OVERPASS_URL, "https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"].filter(
  Boolean,
) as string[];

export type Search = { area: string; country: Country; kinds: Kind[] };

export type Found = {
  name: string;
  kind: string;
  area: string;
  country: Country;
  phone: string | null;
  email: string | null;
  website: string | null;
  domain: string | null;
  socials: string | null;
  address: string | null;
  sourceId: string;
  facts: Record<string, string>;
};

type Box = { south: number; west: number; north: number; east: number; name: string; lat: number; lon: number; wide?: boolean };

type Hit = { boundingbox: [string, string, string, string]; display_name: string; category: string; type: string; addresstype?: string; lat: string; lon: string };

/** A real place (a town or neighbourhood) beats an administrative boundary, and both beat a shop or a park of the same name. */
const RANK = (h: Hit) =>
  h.category === "place" && ["city", "town", "suburb", "neighbourhood", "quarter", "village", "borough"].includes(h.type)
    ? 0
    : h.category === "boundary" && h.type === "administrative"
      ? 1
      : 2;

/** At most this far from the middle (about 13 km), so a big city searches its busy centre and the query stays quick. */
const HALF = 0.12;

/**
 * The area to search, from Nominatim (kept for 30 days). Very large matches
 * (a whole county) are cut to their middle and flagged, so the owner can name
 * a neighbourhood instead.
 */
export async function locate(payload: Payload, area: string, country: Country): Promise<Box> {
  const key = `outreach:geo2:${country}:${area.trim().toLowerCase()}`;
  const kept = await payload.kv.get<Box & { at: number }>(key);
  if (kept && Date.now() - kept.at < 30 * 86_400_000) return kept;
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: area, countrycodes: country.toLowerCase(), format: "jsonv2", limit: "6" })}`;
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Couldn't look up “${area}” on the map (${res.status}).`);
  const hits = (await res.json()) as Hit[];
  const hit = [...hits].sort((a, b) => RANK(a) - RANK(b))[0];
  if (!hit) throw new Error(`“${area}” wasn't found on the map in ${COUNTRIES[country]?.label ?? country}. Try the town or neighbourhood name with its city, e.g. “Lekki Phase I, Lagos”.`);
  const [south, north, west, east] = hit.boundingbox.map(Number);
  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  // A point (a neighbourhood's centre) gets a few kilometres around it; a huge area is cut to its middle.
  const halfLat = Math.min(HALF, Math.max(0.03, (north - south) / 2));
  const halfLon = Math.min(HALF, Math.max(0.03, (east - west) / 2));
  const box: Box = { south: lat - halfLat, north: lat + halfLat, west: lon - halfLon, east: lon + halfLon, lat, lon, name: hit.display_name, wide: north - south > 2 * HALF || east - west > 2 * HALF };
  await payload.kv.set(key, { ...box, at: Date.now() });
  return box;
}

const CONTACT_KEYS = "phone|contact:phone|mobile|contact:mobile|contact:whatsapp|email|contact:email";

/** One kind of business at a time: small queries finish quickly even when the map service is busy. */
function query(box: Box, kind: Kind, max: number) {
  const bbox = `${box.south.toFixed(5)},${box.west.toFixed(5)},${box.north.toFixed(5)},${box.east.toFixed(5)}`;
  const parts = KINDS[kind].osm.map(([key, values]) => `nwr["${key}"~"^(${values})$"]["name"][!"brand"][!"brand:wikidata"][~"^(${CONTACT_KEYS})$"~"."](${bbox});`);
  return `[out:json][timeout:25];(${parts.join("")});out center tags ${max};`;
}

type Element = { type: string; id: number; tags?: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number } };

async function overpass(q: string): Promise<Element[]> {
  let last: unknown;
  for (const endpoint of OVERPASS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: q }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`busy (${res.status})`);
      if (!res.ok) throw new Error(`refused the search (${res.status})`);
      return ((await res.json()) as { elements?: Element[] }).elements ?? [];
    } catch (err) {
      last = err;
    }
  }
  throw new Error(`The map search didn't answer (${(last as Error)?.name === "TimeoutError" ? "timed out" : ((last as Error)?.message ?? last)}). Try again in a few minutes.`);
}

/** Chains and big companies: they have head offices and agencies, not a need for us. */
const CHAINS =
  /\b(chicken republic|kfc|domino'?s|pizza hut|burger king|mcdonald'?s|subway|starbucks|costa coffee|greggs|pret a manger|nando'?s|five guys|wingstop|papa john'?s|krispy kreme|cold ?stone|shoprite|spar|game stores?|justrite|mr\.? ?biggs|tantalizers|kilimanjaro|sweet sensation|bukka hut|tasty fried chicken|debonairs|mega chicken|genesis (restaurant|deluxe)|cafe neo|the place restaurant|walmart|target|costco|walgreens|cvs|tesco|sainsbury'?s|asda|lidl|aldi|morrisons|waitrose|boots|superdrug|mtn|glo world|airtel|9mobile|gtbank|guaranty trust|access bank|zenith bank|first bank|uba|union bank|fidelity bank|sterling bank|stanbic|ecobank|wema bank|polaris bank|keystone bank|fcmb|totalenergies|oando|conoil|ardova|nnpc|mrs oil|hilton|marriott|radisson|sheraton|eko hotel|federal palace|best western|holiday inn|premier inn|travelodge|ibis|novotel|filmhouse|silverbird|pension)\b/i;

const SOCIAL = /(^|\.)(facebook|fb|instagram|linktr|linktree|tiktok|twitter|x|wa|whatsapp|business\.site)\.(com|me|ee)\b/i;

/** "www.example.com/x" → "https://www.example.com/x"; social pages aren't websites. */
export function cleanWebsite(raw: string | null | undefined): { website: string | null; domain: string | null; social: string | null } {
  const v = String(raw ?? "").trim().split(/[;\s]/)[0];
  if (!v) return { website: null, domain: null, social: null };
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `http://${v}`);
    if (SOCIAL.test(url.hostname)) return { website: null, domain: null, social: url.toString() };
    return { website: url.toString(), domain: url.hostname.replace(/^www\./, "").toLowerCase(), social: null };
  } catch {
    return { website: null, domain: null, social: null };
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function toFound(el: Element, search: Search): Found | null {
  const t = el.tags ?? {};
  const name = (t.name || t["name:en"] || "").trim();
  if (!name || CHAINS.test(name) || CHAINS.test(t.operator ?? "")) return null;
  const tag = search.kinds.flatMap((k) => KINDS[k].osm as [string, string][]).find(([key, values]) => t[key] && new RegExp(`^(${values})$`).test(t[key]));
  const kind = tag ? plainKind(t[tag[0]]) : "business";
  const site = cleanWebsite(t.website || t["contact:website"] || t.url);
  const phone = tidyPhone(t["contact:whatsapp"] || t.mobile || t["contact:mobile"] || t.phone || t["contact:phone"], search.country);
  const emailRaw = (t.email || t["contact:email"] || "").split(/[;,\s]/)[0].trim();
  const email = EMAIL.test(emailRaw) ? emailRaw.toLowerCase() : null;
  if (!phone && !email) return null;
  const socials = [site.social, t["contact:instagram"], t["contact:facebook"], t.facebook, t.instagram].filter(Boolean).join(" ") || null;
  const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
  const address = [street, t["addr:suburb"], t["addr:city"]].filter(Boolean).join(", ") || null;
  const facts: Record<string, string> = {};
  for (const k of ["opening_hours", "cuisine", "description", "healthcare:speciality", "school", "stars", "delivery", "takeaway", "outdoor_seating", "wheelchair"]) if (t[k]) facts[k] = t[k];
  // Where it is, for the map on its preview.
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (typeof lat === "number" && typeof lon === "number") {
    facts.lat = lat.toFixed(6);
    facts.lon = lon.toFixed(6);
  }
  return {
    name,
    kind,
    area: [t["addr:suburb"], t["addr:city"]].filter(Boolean).join(", ") || search.area,
    country: search.country,
    phone,
    email,
    website: site.website,
    domain: site.domain,
    socials,
    address,
    sourceId: `osm:${el.type}/${el.id}`,
    facts,
  };
}

/** Phones, emails and domains of businesses that asked not to be contacted (kept even if their lead is deleted). */
export async function suppressed(payload: Payload): Promise<Set<string>> {
  return new Set((await payload.kv.get<string[]>("outreach:suppressed")) ?? []);
}

export async function suppress(payload: Payload, keys: (string | null | undefined)[]) {
  const all = await suppressed(payload);
  for (const k of keys) if (k) all.add(k.toLowerCase());
  await payload.kv.set("outreach:suppressed", [...all]);
}

/**
 * Up to `limit` businesses in the area not already in Leads (or asked not to
 * be contacted), saved as new leads. Those without a website come first: they
 * have the most to gain.
 */
export async function findLeads(
  payload: Payload,
  search: Search,
  limit: number,
): Promise<{ added: { id: number | string; name: string }[]; seen: number; area: string; notes: string[] }> {
  const kinds = search.kinds.filter((k) => k in KINDS);
  if (!kinds.length) throw new Error("Choose at least one kind of business.");
  const box = await locate(payload, search.area, search.country);
  const notes: string[] = [];
  if (box.wide) notes.push(`“${search.area}” matched ${box.name}, a very large area, so only its middle was searched. A neighbourhood name finds more (e.g. “Lekki Phase I, Lagos”).`);

  // Kinds take turns leading, so each day starts somewhere new.
  const turnKey = `outreach:kind-turn:${search.country}:${search.area.toLowerCase()}`;
  const turn = ((await payload.kv.get<number>(turnKey)) ?? 0) % kinds.length;
  await payload.kv.set(turnKey, turn + 1);
  const order = [...kinds.slice(turn), ...kinds.slice(0, turn)];

  const known = new Set<string>(await suppressed(payload));
  const chunk = <T,>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
  const added: { id: number | string; name: string }[] = [];
  const taken = new Set<string>();
  let seen = 0;
  let failed = 0;
  for (const kind of order) {
    if (added.length >= limit) break;
    let elements: Element[];
    try {
      elements = await overpass(query(box, kind, 600));
    } catch (err) {
      failed++;
      notes.push(`${KINDS[kind].label}: ${(err as Error).message}`);
      continue;
    }
    const found = elements.map((el) => toFound(el, { ...search, kinds: [kind] })).filter((f): f is Found => Boolean(f));
    seen += found.length;
    // Already known: the same map entry, phone, email or website.
    for (const [field, values] of [
      ["sourceId", found.map((f) => f.sourceId)],
      ["phone", found.map((f) => f.phone).filter(Boolean)],
      ["email", found.map((f) => f.email).filter(Boolean)],
      ["domain", found.map((f) => f.domain).filter(Boolean)],
    ] as const) {
      for (const part of chunk(values as string[], 200)) {
        if (!part.length) continue;
        const { docs } = await payload.find({ collection: "leads", where: { [field]: { in: part } }, limit: part.length * 2, depth: 0, pagination: false, overrideAccess: true, select: { [field]: true } as never });
        for (const d of docs as unknown as Record<string, unknown>[]) if (d[field]) known.add(String(d[field]).toLowerCase());
      }
    }
    const fresh = found.filter((f) => ![f.sourceId, f.phone, f.email, f.domain].some((k) => k && known.has(k.toLowerCase())));
    // No website first, then a phone over only an email.
    fresh.sort((a, b) => Number(Boolean(a.website)) - Number(Boolean(b.website)) || Number(!a.phone) - Number(!b.phone));
    for (const f of fresh) {
      if (added.length >= limit) break;
      const keys = [f.phone, f.email, f.domain].filter(Boolean) as string[];
      if (keys.some((k) => taken.has(k))) continue; // the same business listed twice
      keys.forEach((k) => taken.add(k));
      const doc = await payload.create({
        collection: "leads",
        data: {
          name: f.name,
          kind: f.kind,
          area: f.area,
          country: f.country,
          phone: f.phone,
          email: f.email,
          website: f.website,
          domain: f.domain,
          socials: f.socials,
          address: f.address,
          source: "openstreetmap",
          sourceId: f.sourceId,
          status: "new",
          check: { facts: f.facts },
          log: [{ at: new Date().toISOString(), what: `Found on OpenStreetMap (${search.area})` }],
        } as never,
        overrideAccess: true,
      });
      added.push({ id: doc.id, name: f.name });
    }
  }
  if (failed === order.length) throw new Error(notes.at(-1)?.replace(/^[^:]+: /, "") ?? "The map search didn't answer.");
  return { added, seen, area: box.name, notes };
}

/** A business added by hand (or by Keeper from a conversation). */
export async function addLead(
  payload: Payload,
  input: { name: string; kind?: string; area?: string; country?: Country; phone?: string; email?: string; website?: string; socials?: string; notes?: string },
  source: "manual" | "keeper" = "manual",
) {
  const country = input.country ?? "NG";
  const site = cleanWebsite(input.website);
  const phone = tidyPhone(input.phone, country);
  const email = input.email && EMAIL.test(input.email.trim()) ? input.email.trim().toLowerCase() : null;
  const stop = await suppressed(payload);
  if ([phone, email, site.domain].some((k) => k && stop.has(k.toLowerCase()))) throw new Error(`${input.name} asked not to be contacted, so it wasn't added.`);
  for (const [field, value] of [["phone", phone], ["email", email], ["domain", site.domain]] as const) {
    if (!value) continue;
    const { docs } = await payload.find({ collection: "leads", where: { [field]: { equals: value } }, limit: 1, depth: 0, overrideAccess: true });
    if (docs[0]) return { id: docs[0].id, existed: true, name: (docs[0] as { name: string }).name };
  }
  const doc = await payload.create({
    collection: "leads",
    data: {
      name: input.name.trim(),
      kind: input.kind ?? null,
      area: input.area ?? null,
      country,
      phone,
      email,
      website: site.website,
      domain: site.domain,
      socials: [site.social, input.socials].filter(Boolean).join(" ") || null,
      notes: input.notes ?? null,
      source,
      status: "new",
      check: { facts: {} },
      log: [{ at: new Date().toISOString(), what: source === "manual" ? "Added by hand" : "Added by Keeper" }],
    } as never,
    overrideAccess: true,
  });
  return { id: doc.id, existed: false, name: input.name };
}
