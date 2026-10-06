/*
 * The kinds of business it looks for, the places, and phone numbers. Each kind
 * is a set of OpenStreetMap tags (see find.ts); the labels are what the owner
 * picks from in Clients → Settings.
 */

type Tagged = [key: string, values: string];

export const KINDS = {
  food: { label: "Restaurants, cafés and bars", osm: [["amenity", "restaurant|cafe|fast_food|bar|pub|ice_cream|food_court"], ["shop", "bakery|pastry|confectionery"]] },
  beauty: { label: "Salons, barbers and spas", osm: [["shop", "hairdresser|beauty|cosmetics|massage|tattoo|nails"], ["leisure", "spa"], ["amenity", "spa"]] },
  health: {
    label: "Clinics, dentists and pharmacies",
    osm: [["amenity", "clinic|dentist|doctors|pharmacy|hospital|veterinary"], ["healthcare", "clinic|dentist|doctor|physiotherapist|laboratory|optometrist|centre"], ["shop", "optician|medical_supply"]],
  },
  education: { label: "Schools and training", osm: [["amenity", "school|kindergarten|college|driving_school|language_school|music_school|training|prep_school"]] },
  stay: { label: "Hotels and short-lets", osm: [["tourism", "hotel|guest_house|motel|hostel|apartment"]] },
  shops: {
    label: "Shops and boutiques",
    osm: [["shop", "clothes|shoes|boutique|fashion|jewelry|furniture|electronics|mobile_phone|computer|gift|perfumery|bag|interior_decoration|houseware|supermarket|wholesale"]],
  },
  property: { label: "Real estate", osm: [["office", "estate_agent|property_management"], ["shop", "estate_agent"]] },
  professional: {
    label: "Lawyers, accountants and consultants",
    osm: [["office", "lawyer|accountant|consulting|insurance|financial|financial_advisor|architect|engineer|tax_advisor|notary|advertising_agency|it|logistics|travel_agent"]],
  },
  fitness: { label: "Gyms and sports", osm: [["leisure", "fitness_centre|sports_centre|dance|yoga"], ["amenity", "gym"]] },
  auto: { label: "Car dealers and repairs", osm: [["shop", "car|car_repair|car_parts|tyres|motorcycle"], ["amenity", "car_wash|car_rental"]] },
  events: { label: "Events, photographers and caterers", osm: [["amenity", "events_venue|conference_centre"], ["craft", "photographer|caterer|event_planner"], ["shop", "party|photo"]] },
  trades: {
    label: "Builders, cleaners and trades",
    osm: [
      ["craft", "builder|carpenter|electrician|plumber|painter|tiler|hvac|roofer|window_construction|tailor|dressmaker|shoemaker"],
      ["shop", "hardware|doityourself|trade|tailor|dry_cleaning|laundry"],
      ["office", "construction_company"],
    ],
  },
} satisfies Record<string, { label: string; osm: Tagged[] }>;

export type Kind = keyof typeof KINDS;
export const KIND_OPTIONS = Object.entries(KINDS).map(([value, k]) => ({ value, label: k.label }));

/** Countries it can look in, with the calling code used to tidy local phone numbers. */
export const COUNTRIES = {
  NG: { label: "Nigeria", code: "234" },
  GH: { label: "Ghana", code: "233" },
  KE: { label: "Kenya", code: "254" },
  ZA: { label: "South Africa", code: "27" },
  GB: { label: "United Kingdom", code: "44" },
  IE: { label: "Ireland", code: "353" },
  US: { label: "United States", code: "1" },
  CA: { label: "Canada", code: "1" },
} as const;

export type Country = keyof typeof COUNTRIES;
export const COUNTRY_OPTIONS = Object.entries(COUNTRIES).map(([value, c]) => ({ value, label: c.label }));

/** What a tag means in plain words ("hairdresser" → "hair salon"), for messages and lists. */
const PLAIN: Record<string, string> = {
  fast_food: "fast-food place",
  ice_cream: "ice-cream shop",
  hairdresser: "hair salon",
  beauty: "beauty salon",
  doctors: "doctor's practice",
  estate_agent: "estate agent",
  fitness_centre: "gym",
  sports_centre: "sports centre",
  car_repair: "car repair shop",
  car_parts: "car parts shop",
  guest_house: "guest house",
  events_venue: "events venue",
  dry_cleaning: "dry cleaner",
  driving_school: "driving school",
  language_school: "language school",
  mobile_phone: "phone shop",
  it: "IT company",
  property_management: "property manager",
};

export const plainKind = (value: string) => PLAIN[value] ?? value.replace(/_/g, " ");

/**
 * A phone number in international form (+2348031234567), from however it was
 * written ("0803 123 4567", "+234 (0) 803…", "08031234567; 0809…"), or null.
 */
export function tidyPhone(raw: string | null | undefined, country: string): string | null {
  if (!raw) return null;
  const first = String(raw).split(/[;,/]|\bor\b/)[0];
  let digits = first.replace(/[^\d+]/g, "");
  if (!digits) return null;
  const code = (COUNTRIES as Record<string, { code: string }>)[country]?.code;
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+")) {
    // "+234 (0) 803…": the trunk zero doesn't belong after the country code.
    digits = `+${digits.slice(1).replace(/^(\d{1,3})0(?=\d{9,})/, (m, cc) => (code && cc === code ? cc : m))}`;
  } else if (code && digits.startsWith(code) && digits.length >= code.length + 9) {
    digits = `+${digits}`;
  } else if (code === "1" && digits.length === 10) {
    digits = `+1${digits}`;
  } else if (code && digits.startsWith("0")) {
    digits = `+${code}${digits.slice(1)}`;
  } else {
    return null;
  }
  const n = digits.slice(1);
  return n.length >= 8 && n.length <= 15 ? `+${n}` : null;
}

/** Nigerian, Ghanaian, Kenyan and South African mobiles, and UK 07…: the numbers WhatsApp is likely to be on. */
export function looksMobile(phone: string): boolean {
  return /^\+234[789][01]\d{8}$/.test(phone) || /^\+233[25]\d{8}$/.test(phone) || /^\+254[17]\d{8}$/.test(phone) || /^\+27[6-8]\d{8}$/.test(phone) || /^\+447\d{9}$/.test(phone) || /^\+1\d{10}$/.test(phone);
}
