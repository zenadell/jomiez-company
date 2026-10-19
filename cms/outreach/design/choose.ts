import { createHash } from "node:crypto";
import { byId, DIRECTIONS, type DirectionId } from "./library";

/*
 * Which directions suit a business, from what it is and what pictures we
 * have of it. The model picks among these (write.ts); without a model, or
 * when it picks something it wasn't offered, the first fitting one is used,
 * with the type and palette chosen by the business's name so two similar
 * businesses don't get identical pages.
 */

export type Assets = { photos: number; products: number };

// Whole words only: "car" must not match "skin care", nor "art" match "apartment".
// First match wins: a "restaurant and bar" is a place to eat before it is a bar.
const KINDS: { test: RegExp; order: DirectionId[] }[] = [
  { test: /\b(clinic|dental|dentist|doctors?|pharmacy|hospital|health|medical|physio(therapy)?|optician|optical|laborator(y|ies)|school|college|kindergarten|nursery|tutors?|tutoring|lawyers?|law firm|legal|accountants?|accounting|consult(ant|ing|ancy)|insurance|finance|estate agents?|real estate|property|architects?|engineering|church|ngo|charity)\b/i, order: ["split", "place", "monument"] },
  { test: /\b(hotels?|guest ?house|lodge|resort|apartments?|shortlets?|restaurants?|cafes?|café|coffee|bakery|bakeries|kitchen|food|grill|suya|eatery|bistro|venue|event hall|hall|gardens?|spa)\b/i, order: ["place", "monument", "split", "catalogue"] },
  { test: /\b(salons?|hair|beauty|nails?|lash(es)?|make-?up|cosmetics?|fashion|boutique|tailor(ing)?|clothing|wear|jewel(le)?ry|shoes?|bags?|furniture|interiors?|decor|florist|flowers?|gifts?|gallery|photograph(y|er))\b/i, order: ["monument", "catalogue", "place", "split"] },
  { test: /\b(gym|fitness|sports?|boxing|martial arts?|crossfit|dance|cars?|auto|autos|tyres?|tires?|motors?|mechanic|garage|car wash|events?|party|club|nightclub|bar|pub|lounge|builders?|electrician|electrical|plumb(er|ing)|carpent(er|ry)|construction|welding|roofing|painting|logistics|courier|recording studio|tattoo|barbers?|barbershop)\b/i, order: ["poster", "monument", "split"] },
  { test: /\b(shop|store|supermarket|mart|market|retail|electronics|phones?|gadgets?|hardware|bookshop|toys?)\b/i, order: ["catalogue", "poster", "monument"] },
];

export function directionsFor(kind: string | undefined, assets: Assets): DirectionId[] {
  const order = KINDS.find((k) => k.test.test(kind ?? ""))?.order ?? ["monument", "split", "poster"];
  const fits = (id: DirectionId) => {
    const d = byId.direction(id)!;
    return (d.needs.photos ?? 0) <= assets.photos && (d.needs.products ?? 0) <= assets.products;
  };
  // A shop with its own product photos: the catalogue is the strongest page it can have.
  const ranked = assets.products >= 4 ? (["catalogue", ...order.filter((d) => d !== "catalogue")] as DirectionId[]) : order;
  const ok = ranked.filter(fits);
  // Every business can have a monument or a split page (one photograph, or none: they cope).
  return ok.length ? ok : ["split"];
}

const pick = <T>(list: T[], seed: string) => list[createHash("sha256").update(seed).digest().readUInt32BE(0) % list.length];

export type Design = { direction: DirectionId; type: string; palette: string };

/** A complete, valid design: the model's choice where it's allowed, otherwise a fitting default. */
export function settle(name: string, offered: DirectionId[], wanted: Partial<Design> = {}): Design {
  const direction = wanted.direction && offered.includes(wanted.direction) ? wanted.direction : offered[0];
  const d = byId.direction(direction)!;
  const type = wanted.type && d.types.includes(wanted.type) ? wanted.type : pick(d.types, `${name}|type`);
  const palette = wanted.palette && d.palettes.includes(wanted.palette) ? wanted.palette : pick(d.palettes, `${name}|palette`);
  return { direction, type, palette };
}

/** For the model: the directions offered, each with its type systems and palettes. */
export function menu(offered: DirectionId[]): string {
  return offered
    .map((id) => {
      const d = byId.direction(id)!;
      const types = d.types.map((t) => `${t} (${byId.type(t)!.note})`).join("; ");
      const pals = d.palettes.map((p) => `${p} (${byId.palette(p)!.note})`).join("; ");
      return `DIRECTION "${d.id}" — ${d.name}: ${d.idea}\n  Words: ${d.copy}\n  Type systems: ${types}\n  Palettes: ${pals}`;
    })
    .join("\n\n");
}

export const ALL_DIRECTIONS = DIRECTIONS.map((d) => d.id);
