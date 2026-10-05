/*
 * Insights articles. Adapted from the Aethron copy map; unverifiable figures
 * (uptime percentages, client results) were removed. Review before publishing.
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "quote"; text: string }
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "list"; items: { title: string; text: string }[] };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  image: string;
  body: Block[];
};

export const articles: Article[] = [
  {
    slug: "the-modern-cloud-clean-architecture",
    title: "The Modern Cloud: Why Clean Architecture Is the Future of Scale",
    excerpt: "How private infrastructure and clean architecture let businesses scale without compromise.",
    category: "Cloud",
    author: "Templeton",
    date: "2026-03-04",
    image: "/media/articles/modern-cloud.jpg",
    body: [
      {
        type: "p",
        text: "As security demands increase and threats evolve, sending sensitive proprietary data to unvetted cloud systems carries real risk. Forward-thinking companies are adopting dedicated, private infrastructure to protect their digital assets and core business logic.",
      },
      { type: "quote", text: "Data sovereignty is a strategic fortress protecting the unique intellectual property of your brand." },
      { type: "h3", text: "The shift toward private systems" },
      {
        type: "p",
        text: "For years, modern software meant compromising on data ownership. We deploy high-performance applications directly into your own cloud environments, so customer data, code and business intelligence stay under your control.",
      },
      { type: "h4", text: "Pillars of robust tech" },
      {
        type: "list",
        items: [
          { title: "Dedicated hosting", text: "Deploying stacks on private VPCs and servers." },
          { title: "High performance", text: "Optimised local pipelines that keep pace with the cloud." },
          { title: "Isolated pipelines", text: "Production databases with no public exposure." },
        ],
      },
      { type: "h3", text: "Distributed architecture" },
      {
        type: "p",
        text: "Modular services let systems synchronise data across regional servers without creating single points of failure: code runs close to the user, only encrypted payloads move between nodes, and confidential records stay in secure databases.",
      },
      { type: "h3", text: "Security as an advantage" },
      {
        type: "p",
        text: "Privacy and compliance are foundational. By designing privacy into every architecture, we turn rigorous standards into an advantage and build lasting trust with your users.",
      },
      { type: "h3", text: "Future-proofing your systems" },
      {
        type: "p",
        text: "The future of software is fast, responsive and intelligent. Jomiez delivers end-to-end engineering and custom AI integrations that help ambitious companies scale with confidence, privacy and full architectural ownership.",
      },
    ],
  },
  {
    slug: "scalable-systems-modernizing-legacy-stacks",
    title: "Scalable Systems: Modernizing Legacy Stacks with Next-Gen Tech",
    excerpt: "A practical guide to integrating custom software and AI into existing business environments.",
    category: "Architecture",
    author: "Jomiez Team",
    date: "2026-02-25",
    image: "/media/articles/scalable-systems.jpg",
    body: [
      {
        type: "p",
        text: "Integrating custom software and modern AI into existing workflows needs a careful approach to infrastructure. The goal is harmony between the systems you already run and the demands of modern web, mobile and cloud products.",
      },
      {
        type: "quote",
        text: "Legacy databases hold key context. Connect them to modern APIs and AI and they become a lasting advantage.",
      },
      { type: "h3", text: "The foundation of modern software" },
      {
        type: "p",
        text: "Modernisation starts with treating data as your most valuable asset. Our first job is the connective tissue: robust middleware and fast APIs that process and deliver data wherever it's needed.",
      },
      {
        type: "list",
        items: [
          { title: "Clean schemas", text: "Transforming scattered formats into unified, well-typed schemas." },
          { title: "Low latency", text: "Tuning server pipelines for fast data delivery." },
          { title: "Data security", text: "Encrypting sensitive information and enforcing strict access controls." },
        ],
      },
      { type: "h3", text: "Custom vs. off-the-shelf" },
      {
        type: "p",
        text: "Off-the-shelf tools are a fine start, but a platform engineered for your domain will outperform generic SaaS on speed, reliability and long-term cost: leaner code, smaller cloud bills and more predictable behaviour.",
      },
      { type: "h3", text: "Human-in-the-loop by design" },
      {
        type: "p",
        text: "Automation shouldn't be all-or-nothing. We roll out progressive levels of control: early on, systems make recommendations your team validates; as confidence grows, they take on more of the routine work.",
      },
      { type: "h3", text: "Looking ahead" },
      {
        type: "p",
        text: "The final step is moving from reactive maintenance to proactive systems that scale before traffic spikes and catch anomalies before users notice. That's the standard we build to at Jomiez Innovation.",
      },
    ],
  },
  {
    slug: "high-performance-apps-empowering-teams",
    title: "High-Performance Apps: Engineering Software That Empowers Teams",
    excerpt: "Why successful software engineering focuses on empowering real users and teams.",
    category: "Product",
    author: "Jomiez Team",
    date: "2026-03-15",
    image: "/media/articles/high-performance.jpg",
    body: [
      {
        type: "p",
        text: "Good software and AI act as force multipliers, freeing teams from tedious manual work so they can focus on strategy, creative problem-solving and sustainable growth.",
      },
      {
        type: "quote",
        text: "Technology is at its best when it becomes an intuitive extension of human capability.",
      },
      { type: "h3", text: "Beyond automation" },
      {
        type: "p",
        text: "We believe human-centred design is the only sustainable way to build digital tools. Instead of black boxes, we design transparent, high-performance interfaces that give teams real leverage and full control.",
      },
      {
        type: "list",
        items: [
          { title: "Intelligent core", text: "Fast querying and cross-referencing that surface the right insight to the right person." },
          { title: "Process automation", text: "Automating syncs, data entry and repetitive workflows." },
          { title: "Design & motion", text: "Modern UI/UX and generative tools that turn concepts into polished products." },
        ],
      },
      { type: "h3", text: "Designing for speed and trust" },
      {
        type: "p",
        text: "People only rely on systems they trust. We build in clear logging, readable summaries of automated actions and feedback loops so teams can inspect and tune their tools continuously.",
      },
      { type: "h3", text: "The return on performance" },
      {
        type: "p",
        text: "Remove repetitive busywork and teams move faster and enjoy the work more. Unified interfaces that bring critical data together turn engineering quality into a lasting business advantage.",
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
