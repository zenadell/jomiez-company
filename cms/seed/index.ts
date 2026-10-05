import fs from "fs";
import path from "path";
import type { Payload } from "payload";
import { articles } from "./content/articles";
import { faqs, pricingTiers } from "./content/faq";
import { stack } from "./content/home";
import { privacy, terms } from "./content/legal";
import { productPages } from "./content/products";
import { projects } from "./content/projects";
import { headlineServices, services } from "./content/services";
import { footerColumns, navLinks, site, tickerMessage } from "./content/site";
import { standards } from "./content/standards";
import { doc, h, list, p, quote } from "./lexical";

/*
 * Fills an empty database with the site exactly as it was built: every page,
 * section, image, product and journal post. Runs by itself on the first
 * `npm run dev`, and before every production build (npm run cms:prepare), and
 * never touches a database that already has content. `npm run seed:fresh`
 * wipes the content and seeds again.
 */

const ctx = { skipRevalidate: true };
const publicDir = path.resolve(process.cwd(), "public");

export async function isEmpty(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: "projects", overrideAccess: true });
  const site = await payload.findGlobal({ slug: "site", overrideAccess: true, depth: 0 });
  return totalDocs === 0 && !site?.name;
}

export async function seedIfEmpty(payload: Payload) {
  if (!(await isEmpty(payload))) return false;
  await seed(payload);
  return true;
}

export async function seed(payload: Payload, { fresh = false } = {}) {
  if (fresh) {
    payload.logger.info("Seed: clearing existing content…");
    for (const collection of ["projects", "articles", "pages", "media", "inquiries"] as const) {
      await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true, context: ctx });
    }
  }
  payload.logger.info("Seed: loading the Jomiez site content…");

  /* ---- Images ---- */
  // Each image is uploaded once, and one at a time: parallel uploads of the
  // same file would race for the same filename (Postgres runs them at once).
  const media = new Map<string, Promise<number>>();
  let queue: Promise<unknown> = Promise.resolve();
  const img = (src: string, alt = ""): Promise<number> => {
    const hit = media.get(src);
    if (hit) return hit;
    const filePath = path.join(publicDir, src);
    if (!fs.existsSync(filePath)) throw new Error(`Seed: missing image ${src}`);
    const upload = queue.then(async () => {
      const created = await payload.create({
        collection: "media",
        data: { alt },
        filePath,
        overrideAccess: true,
        context: ctx,
      });
      return created.id as number;
    });
    queue = upload.catch(() => {});
    media.set(src, upload);
    return upload;
  };

  /* ---- Products & work ---- */
  const projectIds = new Map<string, number>();
  for (const pr of projects) {
    const product = productPages.find((pp) => pp.slug === pr.slug);
    const created = await payload.create({
      collection: "projects",
      overrideAccess: true,
      context: ctx,
      data: {
        _status: "published",
        name: pr.name,
        slug: pr.slug,
        category: pr.category,
        isProduct: Boolean(pr.product),
        summary: pr.summary,
        image: pr.image ? await img(pr.image, `${pr.name} screenshot`) : undefined,
        client: pr.client,
        year: pr.year,
        link: pr.link ? { label: pr.link.label, href: pr.link.href } : undefined,
        services: pr.services.map((text) => ({ text })),
        stats: pr.stats.map((s) => ({ value: s.value, label: s.label })),
        sections: pr.sections.map((s) => ({
          title: s.title,
          body: s.body,
          points: s.points?.map((pt) => ({ title: pt.title, body: pt.body })),
        })),
        productPage: product
          ? {
              hero: {
                title: product.hero.title,
                lead: product.hero.lead,
                cta: { label: product.hero.cta, href: "/contact" },
                image: await img("/media/product/hero.jpg"),
                proof: `From the makers of\n${site.stats[1].value} delivered projects`,
              },
              stats: product.stats.map((s) => ({ value: s.value, text: s.text })),
              showcase: {
                title: product.showcase.title,
                lead: product.showcase.lead,
                background: await img("/media/product/panel.jpg"),
                screen: await img(product.showcase.image, `${product.name} interface`),
                address: product.showcase.address,
              },
              cards: await Promise.all(
                product.cards.map(async (c, i) => ({
                  title: c.title,
                  text: c.text,
                  mock: c.mock,
                  mockTitle: c.mockTitle,
                  art: await img(i % 2 ? "/media/product/card-2.jpg" : "/media/product/card-1.jpg"),
                })),
              ),
              statement: product.statement,
              system: {
                label: product.system.label,
                text: product.system.text,
                features: product.system.features.map((f) => ({ icon: f.icon, text: f.text })),
              },
              faq: {
                sub: product.faq.sub,
                title: product.faq.title,
                items: product.faq.items.map((f) => ({ q: f.q, a: f.a })),
              },
            }
          : undefined,
      },
    });
    projectIds.set(pr.slug, created.id as number);
  }

  /* ---- Journal ---- */
  for (const a of articles) {
    await payload.create({
      collection: "articles",
      overrideAccess: true,
      context: ctx,
      data: {
        _status: "published",
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        category: a.category,
        author: a.author,
        date: new Date(`${a.date}T09:00:00Z`).toISOString(),
        image: await img(a.image, ""),
        body: doc(
          a.body.map((b) => {
            switch (b.type) {
              case "p":
                return p(b.text);
              case "quote":
                return quote(b.text);
              case "h3":
                return h("h2", b.text);
              case "h4":
                return h("h3", b.text);
              case "list":
                return list(b.items);
            }
          }),
        ),
      },
    });
  }

  const global = (slug: string, data: Record<string, unknown>, drafts = true) =>
    payload.updateGlobal({
      slug: slug as never,
      data: (drafts ? { ...data, _status: "published" } : data) as never,
      overrideAccess: true,
      context: ctx,
    });

  /* ---- Site settings ---- */
  await global(
    "site",
    {
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      founder: { name: site.founder.name, alias: site.founder.alias, role: site.founder.role, monogram: "T" },
      stats: site.stats.map((s) => ({ value: s.value, label: s.label })),
      avatars: await Promise.all([1, 2, 3, 4].map((n) => img(`/media/clients/client-${n}.jpg`))),
      stack: stack.map((text) => ({ text })),
      email: site.email,
      location: "Enugu, Nigeria & working worldwide",
      phone: site.phone,
      phoneHref: site.phoneHref,
      socials: site.socials.map((s) => ({ label: s.label, href: s.href, icon: s.icon })),
      ticker: { enabled: true, tag: "//JOMIEZ", message: tickerMessage },
      title: site.title,
      titleTemplate: `%s | ${site.name}`,
      description: site.description,
      ogImage: await img("/media/og.jpg"),
      notifications: {
        autoReply: true,
        autoReplySubject: "We received your message: Jomiez",
        autoReplyBody:
          "Hi {name},\n\nThank you for reaching out to Jomiez. Your message has arrived and a real person will read it. We'll come back to you with our thoughts, and if it's a project, with scope, timeline and cost.\n\nUntil then,\nThe Jomiez team",
      },
    },
    false,
  );

  /* ---- Nav & footer ---- */
  await global("navigation", {
    header: {
      links: navLinks.map((l) => ({ label: l.label, href: l.href })),
      showHire: true,
      hire: { label: "Hire Us", href: "/contact" },
    },
    footer: {
      background: await img("/media/footer-cube.webp"),
      blurb: "Software with deep roots. Talk to {legalName} about the product you want to grow.",
      cta: { label: "Start a project", href: "/contact" },
      followLabel: "Follow us:",
      columns: footerColumns.map((c) => ({
        title: c.title,
        links: c.links.map((l) => ({ label: l.label, href: l.href })),
      })),
      copyright: "© {year} {legalName}. All rights reserved.",
      showWordmark: true,
    },
  });

  /* ---- Effects ---- */
  await global(
    "effects",
    {
      cursorLens: true,
      lensSize: 132,
      navGlass: true,
      footerGlass: true,
      heroDew: true,
      pageTransitions: true,
      smoothScroll: true,
    },
    false,
  );

  /* ---- Home ---- */
  const featured = projects.slice(0, 6).map((pr) => projectIds.get(pr.slug)!);
  await global("home", {
    hero: {
      enabled: true,
      titleMuted: "Where intelligence",
      titleMain: "takes root.",
      lead: "A software company growing its own AI products and custom software for businesses, rooted deep and built to endure.",
      cta: { label: "Start a Project", href: "/contact" },
      background: await img("/media/hero-crt.webp"),
      card: {
        enabled: true,
        title: "Chaka AI",
        subtitle: "// Our flagship product",
        href: "/work/chaka-ai",
        image: await img("/media/work/chaka-ai.jpg", "Chaka AI interface"),
        frame: await img("/media/hero-card.jpg"),
      },
      note: "The tools of our craft, chosen as masons choose stone: for strength, and for time.",
      showStack: true,
    },
    intro: {
      enabled: true,
      statement:
        "Trends wither; craft endures. In a world overgrown with noise, we grow software with deep roots, made to outlast the season.",
      sub: "A software company of engineers and designers, building our own products and the products of those we believe in.",
      projects: {
        value: "80+",
        text: "Projects grown from first sketch to production, for founders, businesses and our own product line.",
      },
      satisfaction: { value: "100%", label: "client satisfaction" },
      years: { value: "7+", text: "Years of craft, and still growing." },
      speed: { title: "Swift by nature", text: "Steady, reliable delivery from first commit to production." },
      quote: {
        text: "We don't chase what's fashionable. We plant ideas, tend them with patience, and build software meant to stand for years.",
        brand: "Jomiez",
        by: `${site.founder.alias}, ${site.founder.role}`,
      },
      showTicker: true,
    },
    work: { enabled: true, marquee: "Creations", projects: featured },
    services: {
      enabled: true,
      label: "Services",
      intro:
        "Beyond our own products, we lend our craft to others, shaping raw ideas into software that feels as natural as it looks.",
      title: "Custom Software, Grown From Deep Roots.",
      cta: { label: "Start a Project", href: "/contact" },
      items: headlineServices.map((s) => ({ title: s.title, body: s.body })),
      texture: await img("/media/services-texture.webp"),
      iso: await img("/media/services-iso.webp"),
    },
    mission: {
      enabled: true,
      label: "Our philosophy",
      statement:
        "We believe technology should grow like nature: patient in its making, quiet in its strength, and in service of the people who use it.",
      body: "We build our own products and our clients' with the same hand. Every line is written to last, every interface shaped to feel familiar, as if it had always been there.",
      modelsIntro:
        "We stand on the shoulders of giants, building on the world's leading AI models and shaping them into tools people trust every day.",
      cta: { label: "Meet Chaka AI", href: "/work/chaka-ai" },
      features: [
        "Interfaces that feel familiar at first touch, and journeys that flow.",
        "Backends with deep roots: scalable, secure and calm under load.",
        "Sub-second interactions, tuned like a well-kept instrument.",
        "Deployed wherever your people are, ready for every season of scale.",
      ].map((text) => ({ text })),
    },
    tenets: {
      enabled: true,
      marquee: "Our Tenets",
      description: "Seven principles carved into everything we make, from our own products to yours.",
      cardFooter: "A Jomiez tenet",
      items: standards.map((s) => ({ title: s.title, tag: s.tag, body: s.body })),
      showTicker: true,
    },
    showcase: {
      enabled: true,
      image: await img("/media/showcase-dial.jpg"),
      lead: "Every product begins as a seed: an idea, handled with patience, grown into something that stands.",
      pill: `${site.stats[0].value} years of craft`,
      title: "Built to Endure.",
    },
    process: {
      enabled: true,
      label: "The four seasons",
      title: "From seed to harvest. The four seasons of every build.",
      texture: await img("/media/process-texture.webp"),
      iso: await img("/media/process-iso.webp"),
      steps: [
        {
          title: "The Seed: Discovery & Scoping",
          tag: "Seed",
          body: "We study your idea, your stack and your goals until we find what is worth growing, then return with scope, timeline and cost.",
        },
        {
          title: "The Root: Architecture & Design",
          tag: "Root",
          body: "The interface and the system beneath it are designed together: journeys, UI, data models and integrations, so what grows above ground is held firmly below.",
        },
        {
          title: "The Growth: Rapid Development",
          tag: "Growth",
          body: "Working software appears early and grows in short cycles beside you, into web, mobile and AI features you can touch.",
        },
        {
          title: "The Harvest: Launch & Care",
          tag: "Harvest",
          body: "We launch on reliable cloud ground, then keep tending: SEO, maintenance and continuous improvement long after release.",
        },
      ],
      closing:
        "We do not rush what is meant to last. Every product is grown to be fast, resilient and ready for the seasons ahead.",
      cta: { label: "Begin With Us", href: "/contact" },
    },
    studio: {
      enabled: true,
      statement:
        "We are a company of engineers, designers and makers, building our own products and the products of those we believe in.",
      intro: "One house, many crafts. Every discipline grows from the same roots and answers to the same tenets.",
      cta: { label: "Our Story", href: "/about" },
      exploreLabel: "Explore →",
      disciplines: [
        {
          name: "Engineering",
          role: "Web & mobile products",
          image: await img("/media/work/zyro.jpg"),
          body: "Websites, web apps, APIs and mobile apps, built to be fast, sturdy and secure.",
          href: "/work/zyro",
        },
        {
          name: "AI Systems",
          role: "Multimodal & voice AI",
          image: await img("/media/work/chaka-ai.jpg"),
          body: "Real-time voice, vision, memory and research, grown in-house in our own Chaka AI.",
          href: "/work/chaka-ai",
        },
        {
          name: "Automation",
          role: "Agents & integrations",
          image: await img("/media/work/chaka-wap.jpg"),
          body: "AI agents that live inside the tools people already use, WhatsApp included.",
          href: "/work/chaka-wap",
        },
        {
          name: "Design",
          role: "UI/UX, brand & motion",
          image: await img("/media/work/renok.jpg"),
          body: "Interfaces, identities and motion that turn still screens into living experiences.",
          href: "/work/renok",
        },
      ],
    },
    pricing: {
      enabled: true,
      marquee: "Pricing",
      intro:
        "Every build is scoped by hand. Tell us what you are growing and we return with scope, timeline and cost. No hidden terms.",
      billing: {
        left: "Per Sprint",
        right: "Milestone",
        hint: "(Flexible)",
        leftNote: "Quoted per sprint",
        rightNote: "Quoted per milestone",
      },
      cardImage: await img("/media/pricing-swirl.jpg"),
      tiers: pricingTiers.map((t) => ({
        name: t.name,
        price: "Custom",
        dark: t.dark,
        blurb: t.blurb,
        features: t.features.map((text) => ({ text })),
        cta: { label: "Get a quote", href: "/contact" },
      })),
      showTicker: true,
    },
    faq: {
      enabled: true,
      label: "The inquiry",
      sub: "Answers on how we scope, build and care for your product, and on the products we make ourselves.",
      title: "Everything you should know before we begin.",
      cta: { label: "Contact Us", href: "/contact" },
      items: faqs.map((f) => ({ q: f.q, a: f.a })),
    },
    journal: {
      enabled: true,
      marquee: "Journal",
      intro: "Field notes from the workshop: architecture, AI and the craft of building software that lasts.",
      cta: { label: "Read the Journal", href: "/insights" },
      count: 3,
    },
    meta: { title: site.title, description: site.description },
  });

  /* ---- About ---- */
  await global("about", {
    hero: {
      title: "We make software meant to outlive the season.",
      lead: "Jomiez Innovation is a software company. We grow our own products, like Chaka AI and Chaka WAP, and craft custom software, web platforms and AI systems for the businesses we work beside.",
      cta: { label: "Start a project", href: "/contact" },
    },
    mosaic: await Promise.all(
      ["chaka-ai", "zyro", "chaka-wap", "renok"].map(async (s) => ({
        image: await img(`/media/work/${s}.jpg`),
      })),
    ),
    story: {
      enabled: true,
      label: "Our story",
      title: "From a single seed, a living company",
      cta: { label: "Contact Us", href: "/contact" },
      paragraphs: [
        `We are ${site.legalName}, a software company of engineers, designers and makers. We grow our own products and build for others with the same care: custom software, web and mobile applications and AI systems, from the interface down to the infrastructure beneath it.`,
        `The company is led by ${site.founder.name}, known as ${site.founder.alias}, our founder and lead engineer. He works in React, Next.js, Node.js and Python and builds AI on Gemini, OpenAI and Claude. That work took root in our own products: Chaka AI, a multimodal voice assistant, and Chaka WAP, a local-first AI engine that lives inside WhatsApp.`,
      ].map((text) => ({ text })),
      showStats: true,
    },
    crafts: {
      enabled: true,
      label: "Our crafts",
      statement: "What we learn growing our own products, we bring to yours.",
      lead: "Custom software, web and mobile applications and AI integrations: fast, sturdy and secure, from first idea to launch and beyond.",
      showStack: true,
      cards: [
        {
          title: "Software Strategy",
          body: "We define the roadmap for your digital platforms, with modular architecture and long-term scalability in mind.",
          shape: "blocks",
        },
        {
          title: "Full-Stack Development",
          body: "Fast, reactive web and mobile applications with low latency and modern frameworks.",
          shape: "zline",
        },
        {
          title: "AI & Automation",
          body: "Tailored AI assistants, multimodal agents and automated workflows that lift your operations.",
          shape: "rings",
        },
        {
          title: "Cloud & APIs",
          body: "Robust backend services, secure REST APIs and reliable database structures.",
          shape: "diamond",
        },
      ],
    },
    showTenets: true,
    showFaq: true,
    meta: {
      title: `About | ${site.name}`,
      description:
        "Jomiez Innovation is a software company founded by Emmanuel Ezinna Nweke (Templeton). We grow our own AI products and build custom software, web and mobile apps and AI systems for businesses.",
    },
  });

  /* ---- Services ---- */
  await global("services-page", {
    hero: {
      eyebrow: "Services",
      title: "The craft behind our products, turned to yours.",
      lead: "Custom software, websites, web and mobile applications and AI integrations, with the design around them. And once you are live, we stay to tend it: SEO, maintenance and growth.",
      cta: { label: "Start a project", href: "/contact" },
    },
    showAccordion: true,
    showProcess: true,
    list: {
      enabled: true,
      title: "Every craft we practise",
      items: services.map((s) => ({ title: s.title, body: s.body })),
    },
    showFaq: true,
    meta: {
      title: `Services | ${site.name}`,
      description:
        "The craft behind Jomiez products, turned to yours: custom software, web and mobile applications, AI development and automation, UI/UX, branding and motion design.",
    },
  });

  /* ---- Products & work page ---- */
  await global("work-page", {
    image: await img("/media/pricing-swirl.jpg"),
    marquee: "Creations",
    note: "{products} products of our own and {builds} builds grown for businesses, across AI, automation, web platforms and e-commerce.",
    productsLabel: "Our products",
    clientsLabel: "Built for businesses",
    caseStudy: {
      productKicker: "Our product",
      caseKicker: "Case study",
      nextProduct: "Next product",
      nextCase: "Next creation",
      ctaTitle: "Have something like this ready to grow?",
      cta: { label: "Start a project", href: "/contact" },
    },
    showFaq: true,
    meta: {
      title: `Products & Work | ${site.name}`,
      description:
        "Jomiez products, like Chaka AI and Chaka WAP, and the software we have grown for businesses: SaaS, creative platforms and e-commerce.",
    },
  });

  /* ---- Journal page ---- */
  await global("journal-page", {
    marquee: "Journal",
    intro: "Field notes from the workshop: on architecture, AI and the craft of building software that lasts.",
    post: {
      authorLabel: "Author",
      dateLabel: "Published",
      byLabel: "Written by",
      moreTitle: "More insights",
      cta: { label: "Work with Jomiez", href: "/contact" },
    },
    meta: {
      title: `Journal | ${site.name}`,
      description: "Field notes from the Jomiez workshop on software architecture, AI systems and product design.",
    },
  });

  /* ---- Contact ---- */
  const whatsapp = site.socials.find((s) => s.icon === "whatsapp")!.href;
  await global("contact-page", {
    split: {
      title: "Plant your idea with Jomiez.",
      lead: "Every lasting product began as a seed. Tell us what you want to grow and we will come back with scope, timeline and cost.",
      image: await img("/media/showcase-dial.jpg"),
      visualTitle: "Let's grow something that lasts.",
      form: {
        nameLabel: "Name",
        namePlaceholder: "Alex Johnson",
        emailLabel: "Email",
        emailPlaceholder: "you@company.com",
        budgetLabel: "Budget",
        budgets: ["Not sure yet", "Under $2,000", "$2,000 – $5,000", "$5,000 – $15,000", "$15,000+"].map((text) => ({
          text,
        })),
        messageLabel: "Message",
        messagePlaceholder: "Tell us about your project…",
        submitLabel: "Send enquiry",
        successMessage: "Thank you. Your message has reached us, and we'll be in touch soon.",
        errorMessage: `Something went wrong sending your message. Please try again, or write to ${site.email}.`,
      },
    },
    call: {
      enabled: true,
      image: await img("/media/work/chaka-ai.jpg", "Chaka AI, built by Jomiez"),
      label: "Speak with us",
      title: "Rooted in craft, growing software that businesses and people rely on.",
      body: "Prefer to talk it through? Send us a few times that suit you and we will set up a call to walk through your project in detail.",
      showSocials: true,
      cta: { label: "Book a call", href: whatsapp },
    },
    showFaq: true,
    meta: {
      title: `Contact | ${site.name}`,
      description:
        "Plant your idea with Jomiez Innovation: custom software, web and mobile apps, and AI systems from the makers of Chaka AI.",
    },
  });

  /* ---- Legal ---- */
  const legal = (sections: typeof privacy) =>
    sections.map((s) => ({
      title: s.title,
      body: s.body,
      intro: s.intro,
      items: s.items?.map((text) => ({ text })),
    }));
  await global("privacy", {
    title: "Privacy Policy",
    intro:
      "This policy explains what information Jomiez Innovation collects when you use our website and services, and how we use and protect it.",
    sections: legal(privacy),
    contactNote: true,
    meta: {
      title: `Privacy Policy | ${site.name}`,
      description: "How Jomiez Innovation collects, uses and protects your information.",
    },
  });
  await global("terms", {
    title: "Terms & Conditions",
    intro:
      "Please read these terms carefully before using the Jomiez Innovation website or engaging us for a project.",
    sections: legal(terms),
    contactNote: true,
    meta: {
      title: `Terms & Conditions | ${site.name}`,
      description: "The terms that apply when you use the Jomiez Innovation website and services.",
    },
  });

  /* ---- 404 ---- */
  await global("not-found", {
    title: "This path has grown over.",
    body: "The link may be broken or the page may have moved. Let's lead you back.",
    cta: { label: "Back to home", href: "/" },
  });

  payload.logger.info(`Seed: done (${media.size} images, ${projects.length} projects, ${articles.length} posts).`);
}
