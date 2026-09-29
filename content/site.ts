export const site = {
  name: "Jomiez",
  legalName: "Jomiez Innovation",
  url: "https://jomiez.com",
  title: "Jomiez | Software & AI Company",
  description:
    "Jomiez Innovation is a software company. We grow our own AI products, like Chaka AI, and build custom software, web and mobile apps and AI systems for businesses worldwide.",
  email: "hello@jomiez.com",
  phone: "+1 (425) 263-7569",
  phoneHref: "tel:+14252637569",
  founder: {
    name: "Emmanuel Ezinna Nweke",
    alias: "Templeton",
    role: "Founder & Lead Engineer",
  },
  stats: [
    { value: "7+", label: "Years of craft" },
    { value: "80+", label: "Projects delivered" },
    { value: "100%", label: "Client satisfaction" },
  ],
  socials: [
    { label: "WhatsApp", href: "https://wa.me/+2349119404716", icon: "whatsapp" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/emmanuel-nweke-38a271292", icon: "linkedin" },
    { label: "GitHub", href: "https://github.com/zenadell", icon: "github" },
    { label: "Instagram", href: "https://www.instagram.com/chaka_ai_", icon: "instagram" },
  ],
} as const;

export const navLinks = [
  { label: "Products", href: "/work" },
  { label: "Services", href: "/#capabilities" },
  { label: "Journal", href: "/insights" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Company", href: "/about" },
] as const;

export const footerColumns = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "Chaka AI", href: "/work/chaka-ai" },
      { label: "Products & Work", href: "/work" },
      { label: "Journal", href: "/insights" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Book A Call", href: "/contact#book" },
      { label: "WhatsApp", href: "https://wa.me/+2349119404716" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Terms & Conditions", href: "/terms-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
] as const;

export const tickerMessage =
  "Now growing: Chaka AI, our multimodal voice assistant, alongside new builds for founders and businesses around the world.";
