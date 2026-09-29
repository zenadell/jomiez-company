/* Jomiez products and client builds. All copy is taken from jomiez.com; facts shown as stats come from the case studies themselves. */
export type Project = {
  slug: string;
  name: string;
  category: string;
  /** Made and owned by Jomiez, rather than built for a client. */
  product?: boolean;
  summary: string;
  image?: string;
  link?: { label: string; href: string };
  client?: string;
  year?: string;
  services: string[];
  stats: { value: string; label: string }[];
  sections: { title: string; body?: string; points?: { title: string; body: string }[] }[];
};

export const projects: Project[] = [
  {
    slug: "chaka-ai",
    name: "Chaka AI",
    category: "AI Platform",
    product: true,
    summary:
      "A high-performance humanoid multimodal AI platform with real-time voice interaction, emotional intelligence, advanced research ability and an episodic memory system.",
    image: "/media/work/chaka-ai.jpg",
    services: ["AI Development", "Full-stack Engineering", "UI/UX Design"],
    stats: [
      { value: "Real-time", label: "Voice & vision" },
      { value: "60fps", label: "Neon HUD interface" },
      { value: "Tiered", label: "Memory system" },
      { value: "Imagen 3", label: "Image synthesis" },
    ],
    sections: [
      {
        title: "Executive summary & vision",
        body: "Chaka is an autonomous multimodal intelligence designed to serve as the ultimate personal assistant. Built by Emmanuel Ezinna Nweke (Templeton) at Jomiez Innovation, Chaka represents a leap toward emotional intelligence in AI, combining real-time voice interaction with a sophisticated tool-use system. Her personality is expressive and professional, designed to assist, research, and evolve alongside her users.",
      },
      {
        title: "Technical infrastructure",
        body: "The backend is a Node.js/Express application optimised for “warm performance”: an aggressive warm-up pipeline, including DNS pre-warming and library pre-initialisation, shaves milliseconds off external requests. The stack uses Turso (SQLite) for low-latency storage and Firebase Admin for secure authentication.",
      },
      {
        title: "AI orchestration & multimodal capabilities",
        points: [
          { title: "Real-time interaction", body: "Gemini 2.5 Flash native audio for low-latency voice and visual streaming over WebSocket proxies." },
          { title: "Reasoning & vision", body: "Gemini 2.0 Flash for general chat logic and deep multimodal input analysis." },
          { title: "Creative tools", body: "High-fidelity image synthesis through Vertex AI (Imagen 3) and near-perfect transcription with OpenAI Whisper." },
          { title: "Key management", body: "A dedicated ApiKeyManager rotates search, text and multimodal keys automatically to prevent interruptions." },
        ],
      },
      {
        title: "Frontend & UI/UX",
        body: "The “Neon HUD” interface is built on glassmorphism and high-aesthetic performance, with GSAP-driven micro-animations and an interactive face visualiser featuring gaze tracking, randomised blinking and emotional state rendering. Hybrid RAG orchestration offloads vector math to background Web Workers, keeping the UI at a consistent 60fps.",
      },
      {
        title: "The memory system",
        body: "Chaka builds a cognitive model of her users through a tiered memory system. Episodic memories log individual moments with associated emotions, while semantic memory distils them into a permanent identity profile. A background “Reflection” process consolidates memories to prevent bloat, so the AI can keep long-term goals and unfinished “open loops” for proactive interaction.",
      },
      {
        title: "Research & video analysis",
        points: [
          { title: "VideoAgent", body: "Scene-by-scene visual and audio analysis of video content using yt-dlp and Gemini Flash." },
          { title: "Deep research", body: "A tiered search system using Serper, Tavily and Firecrawl to extract research-ready data from complex or bot-shielded websites." },
          { title: "Silent execution", body: "In Live Mode, Chaka runs tools silently to mimic human thought patterns rather than command-line feedback." },
        ],
      },
    ],
  },
  {
    slug: "chaka-wap",
    name: "Chaka WAP",
    category: "AI Automation",
    product: true,
    summary:
      "A multimodal, local-first AI engine that joins WhatsApp conversations as a human-like participant, with dynamic style learning and a robust failover architecture.",
    image: "/media/work/chaka-wap.jpg",
    services: ["AI Development", "WhatsApp Automation", "Backend Engineering"],
    stats: [
      { value: "10x", label: "Faster reads" },
      { value: "384-dim", label: "Local embeddings" },
      { value: "Multi-LLM", label: "Failover routing" },
      { value: "Node.js", label: "Core runtime" },
    ],
    sections: [
      {
        title: "Project overview & architecture",
        body: "Chaka WAP is an advanced AI engine designed to operate autonomously on WhatsApp. Unlike traditional bots, it uses a Dynamic Style Learning Engine to mirror the conversational style, slang and brevity of the person it's talking to. The system runs on a decoupled architecture: a WhatsApp Web bridge, a local SQLite memory engine and a multi-LLM orchestrator.",
      },
      {
        title: "The tech stack",
        points: [
          { title: "Backend", body: "Node.js with @whiskeysockets/baileys for the WhatsApp socket protocol." },
          { title: "Database", body: "Local SQLite for fast, encrypted storage of chat logs and binary vector embeddings." },
          { title: "AI brain", body: "Gemini 2.5 Flash for reasoning and Gemini 1.5 Flash for vision." },
          { title: "Local memory", body: "@xenova/transformers runs locally to generate 384-dimensional vectors for private, cost-free RAG." },
          { title: "Admin UI", body: "A real-time dashboard in Vanilla JS, Tailwind CSS and Socket.io for live telemetry and log monitoring." },
        ],
      },
      {
        title: "Memory logic & style learning",
        body: "Chaka remembers the whole relationship: an ingestion pipeline saves message embeddings as binary BLOBs in SQLite, and every reply runs a cosine-similarity search to pull relevant history into context. The engine also analyses a user's last 5–8 messages to mirror their syntax, capitalisation and use of Nigerian Pidgin.",
      },
      {
        title: "Vision & failover",
        body: "The system is fully multimodal, intercepting media to provide “occasion inference”: working out why a photo was sent from the chat so far. To stay online, an Ironclad Routing Orchestrator rotates through model versions and API keys whenever rate limits are hit.",
      },
      {
        title: "Evolution & optimisation",
        points: [
          { title: "Storage", body: "Migrated from Firebase to local SQLite to escape document size limits and latency." },
          { title: "Embeddings", body: "Replaced cloud embedding APIs with local transformers to remove API costs and improve privacy." },
          { title: "Data handling", body: "Moved from string vectors to binary BLOBs, shrinking the database and speeding up reads 10x." },
          { title: "UI fluidity", body: "Flex-based layouts let the admin dashboard scale from 4K monitors down to phones." },
        ],
      },
    ],
  },
  {
    slug: "zyro",
    name: "Zyro",
    category: "SaaS Landing",
    summary:
      "A modern, high-performance SaaS landing page system for startups and digital products, built around conversion-led storytelling and pixel-perfect responsiveness.",
    image: "/media/work/zyro.jpg",
    client: "NFrame",
    year: "2025",
    link: { label: "zyro.framer.media", href: "https://zyro.framer.media" },
    services: ["Web Design", "Framer Development"],
    stats: [
      { value: "2025", label: "Launched" },
      { value: "NFrame", label: "Client" },
      { value: "Framer", label: "Built with" },
      { value: "3 devices", label: "Fully responsive" },
    ],
    sections: [
      {
        title: "Project overview & strategy",
        body: "Zyro is a modern, carefully crafted SaaS landing page for startups, digital products and growing tech companies. It centres on a clean visual style and clear content structure, helping brands present their value proposition in a professional, engaging way, with the focus on clarity and conversion.",
      },
      {
        title: "The challenge",
        body: "Founders and product teams need to launch a professional, high-converting website at record speed without compromising design quality. The goal was a flexible framework that scales alongside a digital product while keeping visual harmony across complex feature sets.",
      },
      {
        title: "The solution",
        body: "A modular landing page structure that balances bold typography with spacious layouts and stays fully responsive on every device. The no-code-ready Framer build allows rapid customisation and adapts to evolving brand identities without heavy developer handoff.",
      },
      {
        title: "Key deliverables",
        points: [
          { title: "Modern SaaS design", body: "A clean, professional aesthetic with modern UI elements and balanced typography." },
          { title: "Conversion-focused architecture", body: "A landing flow built to guide visitors toward clear calls to action." },
          { title: "Cross-device performance", body: "Layouts optimised for desktop, tablet and mobile." },
          { title: "Product storytelling", body: "Components that highlight core features, benefits and social proof." },
          { title: "Scalable framework", body: "Built for fast iteration so teams can ship updates in real time." },
        ],
      },
    ],
  },
  {
    slug: "renok",
    name: "Renok",
    category: "Creative Studio",
    summary:
      "A premium digital identity system for a creative agency, with bold brand storytelling, modular grid architecture and high-end motion transitions.",
    image: "/media/work/renok.jpg",
    services: ["Web Development", "UI/UX Design", "Brand Architecture"],
    stats: [
      { value: "Webflow", label: "Platform" },
      { value: "GSAP", label: "Motion engine" },
      { value: "Modular", label: "Grid system" },
      { value: "CMS", label: "Content ready" },
    ],
    sections: [
      {
        title: "Project overview & strategy",
        body: "Renok is a modern, high-performance creative studio platform built to turn brand vision into tangible digital results. It centres on an experience-driven brand architecture that balances bold artistic strategy with functional, conversion-driven design.",
      },
      {
        title: "The challenge",
        body: "Build a cohesive identity system that supports evolving products and services while keeping a recognisable core, bridging visually intense design with intuitive navigation so deep storytelling never costs usability or performance.",
      },
      {
        title: "The solution",
        body: "A comprehensive brand framework with visual language guidelines and modular grids. The site merges simplicity with strategic depth through clean sectioning, purposeful negative space and refined motion, with responsive adaptability and CMS flexibility for future content.",
      },
      {
        title: "Key deliverables",
        points: [
          { title: "Brand architecture", body: "Narrative-led identity systems with defined typography and colour logic." },
          { title: "Modular interface", body: "Component-based layouts designed for harmony and grid precision." },
          { title: "Interactive web experience", body: "High-end motion stories and transitions powered by Webflow and GSAP." },
          { title: "Strategic UX", body: "Simplified pathways and engagement flows that reduce friction." },
          { title: "Performance", body: "Tuned for consistent reliability and fast loading on every device." },
        ],
      },
    ],
  },
  {
    slug: "job-foundry-hub",
    name: "Job Foundry Hub",
    category: "Web Platform",
    summary:
      "A high-performance career blog and job platform built with Django and PostgreSQL, with an automated SEO auditing system and secure content lifecycle management.",
    services: ["Full-stack Engineering", "SEO Automation"],
    stats: [
      { value: "Django", label: "Framework" },
      { value: "PostgreSQL", label: "Database" },
      { value: "Automated", label: "SEO auditing" },
      { value: "Secure", label: "Content lifecycle" },
    ],
    sections: [
      {
        title: "Overview",
        body: "Job Foundry Hub is a career blog and job platform built for speed and search visibility. It pairs a Django and PostgreSQL backend with an automated SEO auditing system and a secure content lifecycle, so editors can publish confidently and every page stays discoverable.",
      },
    ],
  },
  {
    slug: "morae",
    name: "MORAE",
    category: "E-commerce",
    summary:
      "A minimalist, high-fidelity e-commerce experience for premium audio hardware, defined by precision, material clarity and intentional design.",
    services: ["E-commerce Design", "Web Development"],
    stats: [
      { value: "Premium", label: "Audio hardware" },
      { value: "Minimal", label: "Design language" },
      { value: "Hi-fi", label: "Product storytelling" },
      { value: "Mobile", label: "First checkout" },
    ],
    sections: [
      {
        title: "Overview",
        body: "MORAE is a minimalist e-commerce experience for premium audio hardware. Every screen is built around precision and material clarity, letting the products speak while the shopping flow stays calm and intentional.",
      },
    ],
  },
  {
    slug: "siatra",
    name: "SIATRA",
    category: "E-commerce",
    summary:
      "A refined e-commerce experience that blends 25 years of Italian craftsmanship with modern technology to design spaces that breathe.",
    services: ["E-commerce Design", "Web Development"],
    stats: [
      { value: "25 yrs", label: "Italian craft" },
      { value: "Refined", label: "Storefront" },
      { value: "Modern", label: "Tech stack" },
      { value: "Responsive", label: "All devices" },
    ],
    sections: [
      {
        title: "Overview",
        body: "SIATRA brings 25 years of Italian craftsmanship online. The storefront pairs refined, spacious layouts with modern technology so every collection feels considered and every space can breathe.",
      },
    ],
  },
];

export const featuredProjects = projects.slice(0, 6);

export const ourProducts = projects.filter((p) => p.product);
export const clientWork = projects.filter((p) => !p.product);

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
