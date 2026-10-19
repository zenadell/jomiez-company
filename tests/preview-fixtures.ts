/*
 * Sample leads with homepage previews, one per look, for seeing and testing
 * the preview design without finding real businesses:
 *
 *   DATABASE_URI=file:/tmp/x.db npm run preview:fixtures
 *
 * Then open /preview/fixture-salon (monument), fixture-restaurant (place),
 * fixture-clinic (split), fixture-gym (poster), fixture-shop (catalogue) and
 * fixture-legacy (a version 2 preview, read into the current design). Uses free Unsplash photos. Never run it against
 * the live database: it creates leads.
 */
import { getPayload } from "payload";
import config from "../payload.config";
import type { PreviewContent } from "../cms/outreach/write";

if (/postgres/i.test(process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URI || "")) {
  console.error("Refusing to add sample leads to a Postgres database (that's the live one).");
  process.exit(1);
}

const photo = (id: string, w = 1600, h = 1067, alt = "") => ({ url: `https://images.unsplash.com/${id}?w=${w}&q=80`, w, h, alt });
const stock = (id: string, alt: string) => ({ ...photo(id, 1600, 1067, alt), by: "Unsplash", source: "Unsplash", page: "https://unsplash.com" });

const base = { v: 3 as const, country: "NG", brand: { photos: [], products: [], colours: [] }, stock: [] };

const FIXTURES: { slug: string; lead: Record<string, unknown>; content: PreviewContent }[] = [
  {
    slug: "fixture-salon",
    lead: { name: "Glow Studio", kind: "hair salon", area: "Lekki Phase I, Lagos", phone: "+2348031234567" },
    content: {
      ...base,
      name: "Glow Studio",
      kind: "hair salon",
      area: "Lekki Phase I, Lagos",
      address: "14 Admiralty Way, Lekki Phase I, Lagos",
      phone: "+2348031234567",
      email: "hello@glowstudio.ng",
      socials: "https://instagram.com/glowstudio",
      hours: "Mo-Sa 09:00-19:00; Su 12:00-17:00",
      design: { direction: "monument", type: "gambarino", palette: "blush-aubergine", why: "Glow is a short, soft name: set huge in a flared serif on blush, it reads like a beauty label." },
      headline: "Hair that feels like you",
      sub: "Cuts, colour, braids and treatments in a calm studio on Admiralty Way, by stylists who listen first.",
      cta: "Book on WhatsApp",
      statement: "Glow Studio is a hair salon in Lekki for women who want their hair healthy first and beautiful always, done with care and on time.",
      services: [
        { title: "Cuts & styling", text: "Precision cuts and blowouts shaped around how you actually wear your hair." },
        { title: "Braids & protective styles", text: "Knotless braids, twists and cornrows done neatly and gently on your edges." },
        { title: "Colour", text: "Rich colour and highlights with products that protect your hair's strength." },
        { title: "Treatments", text: "Deep conditioning, scalp care and trims that bring tired hair back to life." },
      ],
      about: "Glow Studio is a small salon on Admiralty Way where every appointment starts with a conversation about your hair. We keep the room calm, the tools clean and the timing honest, so you leave looking like the best version of yourself.",
      highlights: [
        { title: "Healthy hair first", text: "Gentle techniques and good products, every time." },
        { title: "On time", text: "Appointments that start when they say they will." },
        { title: "Easy to book", text: "Message us on WhatsApp and pick a time." },
      ],
      closing: "Your next appointment awaits",
      stock: [stock("photo-1560066984-138dadb4c035", "A bright hair salon"), stock("photo-1522337360788-8b13dee7a37e", "A stylist at work"), stock("photo-1595476108010-b4d1f102b1b1", "Hair care products")],
    },
  },
  {
    slug: "fixture-gym",
    lead: { name: "Iron Republic Gym", kind: "gym", area: "Ikeja, Lagos", phone: "+2348091112233" },
    content: {
      ...base,
      name: "Iron Republic Gym",
      kind: "gym",
      area: "Ikeja, Lagos",
      address: "22 Allen Avenue, Ikeja, Lagos",
      phone: "+2348091112233",
      email: null,
      socials: "https://instagram.com/ironrepublic",
      hours: "Mo-Fr 05:30-22:00; Sa 07:00-20:00",
      design: { direction: "poster", type: "anton", palette: "charcoal-primaries", why: "A gym that opens at 5:30 has a voice: condensed capitals and flat primaries, like a fight poster." },
      headline: "Train harder. Recover smarter.",
      sub: "Free weights, conditioning and coached classes on Allen Avenue, open from 5:30 every weekday morning.",
      cta: "Start on WhatsApp",
      statement: "Iron Republic is a no-nonsense gym in Ikeja for people who want real strength, honest coaching and a floor that's never too crowded to train.",
      services: [
        { title: "Open gym", text: "Racks, platforms and dumbbells up to 50kg, ready when you are." },
        { title: "Personal training", text: "One-to-one coaching built around your goals and your schedule." },
        { title: "Group classes", text: "Conditioning, boxing and mobility classes through the week." },
      ],
      about: "Iron Republic opened on Allen Avenue for people who take training seriously but don't take themselves too seriously. Coaches on the floor, clean equipment and early mornings for those who train before work.",
      highlights: [
        { title: "Opens 5:30am", text: "Train before work, every weekday." },
        { title: "Real coaches", text: "Help on the floor, not just at sign-up." },
        { title: "Room to train", text: "Enough racks that you never wait long." },
      ],
      closing: "Your first session starts here",
      stock: [stock("photo-1534438327276-14e5300c3a48", "A gym floor"), stock("photo-1571019613454-1cb2f99b2d8b", "Training with weights"), stock("photo-1517836357463-d25dfeac3438", "A boxing class")],
    },
  },
  {
    slug: "fixture-clinic",
    lead: { name: "Bright Smile Dental", kind: "dental clinic", area: "Wuse, Abuja", phone: "+2348025556677" },
    content: {
      ...base,
      name: "Bright Smile Dental",
      kind: "dental clinic",
      area: "Wuse, Abuja",
      address: "5 Aminu Kano Crescent, Wuse 2, Abuja",
      phone: "+2348025556677",
      email: "care@brightsmile.ng",
      socials: null,
      hours: "Mo-Fr 08:00-18:00; Sa 09:00-14:00",
      design: { direction: "split", type: "literata", palette: "teal-paper", why: "Families want calm and clear facts: a reading column beside one steady photograph, printed in one teal." },
      headline: "Gentle dental care for the whole family",
      sub: "Check-ups, cleaning, fillings and whitening in Wuse 2, explained clearly and done without rush.",
      cta: "Book a check-up",
      statement: "Bright Smile Dental is a family dental clinic in Wuse 2 that explains every step, keeps appointments calm and treats children and adults alike.",
      services: [
        { title: "Check-ups & cleaning", text: "Regular examinations and professional cleaning to keep problems small." },
        { title: "Fillings & repairs", text: "Tooth-coloured fillings and repairs for chips and cracks." },
        { title: "Whitening", text: "Safe, supervised whitening for a brighter smile." },
        { title: "Children's dentistry", text: "Patient, friendly care that helps children feel at ease." },
        { title: "Emergency visits", text: "Same-day appointments when something hurts." },
      ],
      about: "Bright Smile Dental cares for families across Abuja from a quiet clinic on Aminu Kano Crescent. Every visit begins with a clear explanation of what we see and what we suggest, so you always know your options.",
      highlights: [
        { title: "Clear explanations", text: "You'll know every option before we start." },
        { title: "Family friendly", text: "Care for children and adults in one place." },
        { title: "Saturday hours", text: "Open Saturday mornings for busy weeks." },
      ],
      closing: "Book your check-up today",
      stock: [stock("photo-1629909613654-28e377c37b09", "A modern dental clinic"), stock("photo-1606811971618-4486d14f3f99", "A dentist with a patient"), stock("photo-1588776814546-1ffcf47267a5", "A treatment room")],
    },
  },
  {
    slug: "fixture-restaurant",
    lead: { name: "Mama Put Kitchen", kind: "restaurant", area: "Yaba, Lagos", phone: "+2348067778899" },
    content: {
      ...base,
      name: "Mama Put Kitchen",
      kind: "restaurant",
      area: "Yaba, Lagos",
      address: "8 Herbert Macaulay Way, Yaba, Lagos",
      phone: "+2348067778899",
      email: null,
      socials: "https://instagram.com/mamaputkitchen",
      hours: "Mo-Su 10:00-22:00",
      design: { direction: "place", type: "young-source", palette: "walnut-tan", why: "A kitchen people come back to: the room and the food carry it, set in a homely serif on warm brown." },
      headline: "Home cooking, served with pride",
      sub: "Jollof, swallow and soups, grilled fish and peppered meats, cooked fresh every day on Herbert Macaulay Way.",
      cta: "Order on WhatsApp",
      statement: "Mama Put Kitchen serves the Nigerian food you grew up on, cooked fresh each morning in Yaba and served generously, to eat in or take away.",
      services: [
        { title: "Rice dishes", text: "Party jollof, fried rice and ofada with your choice of protein." },
        { title: "Soups & swallow", text: "Egusi, efo riro, okra and banga with pounded yam, eba or amala." },
        { title: "Grills", text: "Grilled fish, suya-spiced chicken and peppered meats." },
        { title: "Catering", text: "Trays and small chops for office lunches and family events." },
      ],
      about: "Mama Put Kitchen started as a small food spot in Yaba and grew on word of mouth. The pots go on early, the portions are honest and the welcome is warm, whether you sit down or take your food home.",
      highlights: [
        { title: "Cooked fresh daily", text: "Pots on the fire every morning." },
        { title: "Generous portions", text: "Food that actually fills you up." },
        { title: "Order ahead", text: "Send a WhatsApp and pick up hot." },
      ],
      closing: "Come hungry",
      stock: [stock("photo-1517248135467-4c7edcad34c4", "A busy restaurant"), stock("photo-1604329760661-e71dc83f8f26", "A plate of jollof rice"), stock("photo-1555396273-367ea4eb4db5", "A dining room")],
    },
  },
  {
    slug: "fixture-shop",
    lead: { name: "Oak & Weave", kind: "furniture shop", area: "Ikoyi, Lagos", phone: "+2348034445566" },
    content: {
      ...base,
      name: "Oak & Weave",
      kind: "furniture shop",
      area: "Ikoyi, Lagos",
      address: "3 Glover Road, Ikoyi, Lagos",
      phone: "+2348034445566",
      email: "hello@oakandweave.ng",
      socials: "https://instagram.com/oakandweave",
      hours: "Mo-Sa 10:00-18:00",
      design: { direction: "catalogue", type: "hanken", palette: "swap-pastels", why: "Their chairs are the story: each on its own soft tile, named with its price, like a catalogue." },
      headline: "Furniture made to be lived in",
      sub: "Chairs, sofas and stools in solid wood and woven cane, from our showroom on Glover Road in Ikoyi.",
      cta: "Order on WhatsApp",
      statement: "Oak & Weave makes and sells furniture in solid wood and natural weave for homes that are used every day, shown in our Ikoyi showroom.",
      services: [
        { title: "Made to order", text: "Pick a piece and a finish; we make it to your size." },
        { title: "Delivery in Lagos", text: "We deliver and place every piece in your home." },
        { title: "Repairs", text: "Recaning, refinishing and repairs for pieces you already love." },
      ],
      about: "Oak & Weave started with one cane chair and a workshop. Today our Glover Road showroom holds chairs, sofas and stools in solid wood and woven cane, each one made to be sat on daily and to last for years.",
      highlights: [
        { title: "Solid wood", text: "No veneers or chipboard in anything we sell." },
        { title: "Made to size", text: "Most pieces can be made to fit your room." },
        { title: "See it first", text: "Come and sit on it in the showroom." },
      ],
      closing: "Come and sit down",
      brand: {
        photos: [photo("photo-1524758631624-e2822e304c36", 1600, 1067, "The showroom"), photo("photo-1493663284031-b7e3aefcae8e", 1600, 1067, "A living room")],
        products: [
          { ...photo("photo-1567538096630-e0c55bd6374c", 900, 900), title: "Lounge armchair", price: "₦420,000" },
          { ...photo("photo-1586023492125-27b2c045efd7", 900, 900), title: "Cane dining chair", price: "₦185,000" },
          { ...photo("photo-1592078615290-033ee584e267", 900, 900), title: "Accent chair", price: "₦260,000" },
          { ...photo("photo-1503602642458-232111445657", 900, 900), title: "Oak stool", price: "₦95,000" },
          { ...photo("photo-1555041469-a586c61ea9bc", 900, 900), title: "Three-seater sofa", price: "₦980,000" },
          { ...photo("photo-1580480055273-228ff5388ef8", 900, 900), title: "Reading chair", price: "₦310,000" },
          { ...photo("photo-1506439773649-6e0eb8cfb237", 900, 900), title: "Side chair", price: "₦150,000" },
        ],
        colours: [],
      },
    },
  },
];

// A preview made before the design library (version 2), as it is stored in the database: it must still open, in a fitting direction.
const LEGACY = {
  v: 2, name: "Sunrise Bakery", kind: "bakery", area: "Surulere, Lagos", phone: "+2348023334455", style: "editorial", palette: "sand",
  eyebrow: "Bakery · Surulere", headline: "Fresh bread every morning", headlineAccent: "every morning",
  sub: "Bread, pastries and cakes baked before sunrise on Adeniran Ogunsanya Street.", cta: "Order on WhatsApp", marquee: ["Bread", "Cakes"],
  statement: "Sunrise Bakery bakes bread, pastries and celebration cakes every morning for Surulere families and offices.",
  services: [{ title: "Bread", text: "Agege, wholemeal and sourdough loaves, baked daily." }, { title: "Cakes", text: "Birthday and wedding cakes made to order." }, { title: "Pastries", text: "Meat pies, puff-puff and doughnuts, warm in the morning." }],
  about: "Sunrise Bakery has served Surulere from the same corner, with ovens lit before dawn and the first loaves out by six.",
  highlights: [{ title: "Baked daily", text: "Nothing sits overnight." }, { title: "Cakes to order", text: "Tell us the day and the size." }],
  closing: "Order before noon", brand: { photos: [], products: [], colours: [] },
  stock: [stock("photo-1509440159596-0249088772ff", "Fresh bread"), stock("photo-1517433670267-08bbd4be890f", "A bakery counter")],
};
FIXTURES.push({ slug: "fixture-legacy", lead: { name: "Sunrise Bakery", kind: "bakery", area: "Surulere, Lagos", phone: "+2348023334455" }, content: LEGACY as unknown as PreviewContent });

const payload = await getPayload({ config });
for (const f of FIXTURES) {
  const { docs } = await payload.find({ collection: "leads", where: { "preview.slug": { equals: f.slug } }, limit: 1, depth: 0, overrideAccess: true });
  const data = { ...f.lead, status: "ready", preview: { slug: f.slug, kind: "built-in", content: f.content, madeAt: new Date().toISOString(), views: 0 } };
  if (docs[0]) await payload.update({ collection: "leads", id: docs[0].id, data: data as never, overrideAccess: true });
  else await payload.create({ collection: "leads", data: data as never, overrideAccess: true });
  console.log(`/preview/${f.slug}`);
}
process.exit(0);
