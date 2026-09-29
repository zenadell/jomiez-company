export const site = {
  name: "Jomiez",
  legalName: "Jomiez Innovation",
  url: "https://jomiez.com",
  title: "Jomiez | Software Development & AI Development Company",
  description:
    "Jomiez Innovation is a software engineering and AI studio building custom software, web and mobile applications, and production AI systems for ambitious businesses worldwide.",
  email: "hello@jomiez.com",
  phone: "+1 (425) 263-7569",
  phoneHref: "tel:+14252637569",
  founder: {
    name: "Emmanuel Ezinna Nweke",
    alias: "Templeton",
    role: "Founder & Lead Engineer",
  },
  stats: [
    { value: "7+", label: "Years experience" },
    { value: "80+", label: "Successful projects" },
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
  { label: "Works", href: "/work" },
  { label: "Services", href: "/#capabilities" },
  { label: "Insights", href: "/insights" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Company", href: "/about" },
] as const;

export const footerColumns = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/services" },
      { label: "Projects", href: "/work" },
      { label: "Articles", href: "/insights" },
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
  "We are expanding our software engineering and AI capabilities globally, delivering fast, reliable web and mobile products to businesses worldwide.";
