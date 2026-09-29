/* Answers taken from the FAQ on jomiez.com. */
export const faqs = [
  {
    q: "What services do you offer?",
    a: "We build custom software, websites, web and mobile applications, and AI integrations, plus the design work around them: UI/UX, branding and motion. We also handle SEO and ongoing maintenance.",
  },
  {
    q: "Are you taking on new projects?",
    a: "Yes. We have capacity for new client work. Tell us what you are building and we will come back to you with scope, timeline and cost.",
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
    a: "Yes. We take projects from concept through design, development, launch and ongoing support, including SEO and maintenance once you are live.",
  },
] as const;

export const pricingTiers = [
  {
    name: "MVP",
    blurb: "Validate your idea with a production-ready first version.",
    features: ["Discovery & scoping", "UI/UX design", "Web or mobile build", "Launch support"],
    dark: false,
  },
  {
    name: "Growth",
    blurb: "Custom web and mobile applications.",
    features: ["Multi-page web apps", "Scalable cloud database", "Admin dashboards", "SEO setup"],
    dark: false,
  },
  {
    name: "AI Systems",
    blurb: "Custom AI products and automation.",
    features: ["LLM & multimodal integration", "RAG & memory pipelines", "WhatsApp & chat agents", "Model failover"],
    dark: true,
  },
  {
    name: "Partnership",
    blurb: "Ongoing engineering after launch.",
    features: ["Maintenance & updates", "SEO & performance", "New features", "Priority support"],
    dark: false,
  },
] as const;
