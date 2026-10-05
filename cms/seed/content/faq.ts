/* Answers based on the FAQ on jomiez.com. */
export const faqs = [
  {
    q: "What does Jomiez make?",
    a: "Two kinds of things. Our own products, like Chaka AI, a multimodal voice assistant, and Chaka WAP, an AI engine that lives inside WhatsApp. And custom software for businesses: websites, web and mobile apps, APIs and AI systems, with the design around them.",
  },
  {
    q: "Are you taking on new projects?",
    a: "Yes. The workshop is open to new builds. Tell us what you are growing and we will come back with scope, timeline and cost.",
  },
  {
    q: "What tools and technologies do you use?",
    a: "Mainly React, Node.js and Python for engineering, with Next.js and Framer on the front end and Figma for design. For AI work we build on Gemini, OpenAI and Claude.",
  },
  {
    q: "Can we schedule a call to discuss a project?",
    a: "Absolutely. Send us a few times that suit you and we will set up a call to walk through your project in detail.",
  },
  {
    q: "Do you handle a project end to end?",
    a: "Yes. From first sketch through design, development and launch, and in the seasons after: SEO, maintenance and continuous improvement.",
  },
] as const;

export const pricingTiers = [
  {
    name: "MVP",
    blurb: "Plant a production-ready first version and put your idea to the test.",
    features: ["Discovery & scoping", "UI/UX design", "Web or mobile build", "Launch support"],
    dark: false,
  },
  {
    name: "Growth",
    blurb: "Custom web and mobile applications, grown to scale.",
    features: ["Multi-page web apps", "Scalable cloud database", "Admin dashboards", "SEO setup"],
    dark: false,
  },
  {
    name: "AI Systems",
    blurb: "Custom AI products and automation, from the craft behind Chaka AI.",
    features: ["LLM & multimodal integration", "RAG & memory pipelines", "WhatsApp & chat agents", "Model failover"],
    dark: true,
  },
  {
    name: "Partnership",
    blurb: "An engineering partner for the long seasons after launch.",
    features: ["Maintenance & updates", "SEO & performance", "New features", "Priority support"],
    dark: false,
  },
] as const;
