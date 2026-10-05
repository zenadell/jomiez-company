/*
 * Product pages for Jomiez's own products, laid out like the template's
 * "Digital Brain" page. Every fact here comes from the case studies in
 * projects.ts (jomiez.com); nothing is invented.
 */
import type { IconName } from "@/components/ui/Icon";

export type ProductMock = "research" | "prompt";

export type ProductPageData = {
  slug: string;
  name: string;
  hero: { title: string; lead: string; cta: string };
  stats: { value: string; text: string }[];
  showcase: { title: string; lead: string; image: string; address: string };
  cards: { mock: ProductMock; mockTitle: string; title: string; text: string }[];
  statement: string;
  system: { label: string; text: string; features: { icon: IconName; text: string }[] };
  faq: { sub: string; title: string; items: { q: string; a: string }[] };
};

const BUILD_WITH_US = {
  q: "Can Jomiez build something like this for us?",
  a: "Yes. Our AI Systems work brings the craft behind our products to yours: multimodal assistants, memory and RAG pipelines, agents and model failover. Tell us what you are growing.",
};

export const productPages: ProductPageData[] = [
  {
    slug: "chaka-ai",
    name: "Chaka AI",
    hero: {
      title: "Chaka AI: A Mind That Remembers",
      lead: "A multimodal AI with real-time voice, emotional intelligence, deep research and a memory that grows with every conversation.",
      cta: "Ask About Chaka",
    },
    stats: [
      { value: "60fps", text: "A steady interface: Web Workers carry the vector math, never the main thread." },
      { value: "4 models", text: "Gemini 2.5 Flash for live voice, Gemini 2.0 Flash for reasoning, Imagen 3 for images, Whisper for speech." },
      { value: "3 tiers", text: "Serper, Tavily and Firecrawl search in tiers, even through bot-shielded websites." },
      { value: "2 memories", text: "Episodic memory keeps each moment; semantic memory distils them into a lasting profile." },
    ],
    showcase: {
      title: "The Neon HUD",
      lead: "A glassmorphic interface with a living face: gaze tracking, blinking and emotional states, held at a steady 60fps.",
      image: "/media/work/chaka-ai.jpg",
      address: "Chaka AI",
    },
    cards: [
      {
        mock: "research",
        mockTitle: "Researching for you",
        title: "Deep Research",
        text: "A tiered search across Serper, Tavily and Firecrawl pulls research-ready data from complex, even bot-shielded, websites.",
      },
      {
        mock: "prompt",
        mockTitle: "Ask Chaka anything…",
        title: "Live Voice & Vision",
        text: "Gemini native audio streams voice and vision in real time, and in Live Mode her tools run silently, like thought.",
      },
    ],
    statement:
      "Chaka isn't a static assistant; she's a living layer of memory that learns from every conversation, keeps the moments that matter, and returns with them when you need her.",
    system: {
      label: "System: warm and ready",
      text: "Chaka runs on a Node.js core built for warm performance, with Turso for low-latency storage and Firebase Admin for secure sign-in. Hybrid RAG hands the vector math to background workers, so the interface never stutters while she thinks.",
      features: [
        { icon: "shieldCheck", text: "Firebase Admin handles secure authentication; Turso keeps storage close and quick." },
        { icon: "brain", text: "A background reflection process consolidates memories, so long-term goals stay and clutter goes." },
        { icon: "gauge", text: "A warm-up pipeline pre-warms DNS and libraries, shaving milliseconds off every request." },
        { icon: "plugsConnected", text: "An ApiKeyManager rotates search, text and multimodal keys, so she never goes quiet." },
      ],
    },
    faq: {
      sub: "Answers on what Chaka does, the models she runs on and how she remembers.",
      title: "Everything you need to know about Chaka.",
      items: [
        {
          q: "What can Chaka do?",
          a: "Talk and see in real time, research the web in depth, analyse videos scene by scene, generate images with Imagen 3 and transcribe speech with Whisper, all while remembering the people she works with.",
        },
        {
          q: "Which models power Chaka?",
          a: "Gemini 2.5 Flash native audio for live voice and vision, Gemini 2.0 Flash for reasoning, Vertex AI Imagen 3 for images and OpenAI Whisper for transcription.",
        },
        {
          q: "How does Chaka remember?",
          a: "Through tiered memory. Episodic memories log individual moments with their emotions, semantic memory distils them into a permanent profile, and a background reflection process keeps both lean.",
        },
        {
          q: "How does she research?",
          a: "A tiered search across Serper, Tavily and Firecrawl extracts research-ready data, even from complex or bot-shielded websites. Her VideoAgent analyses video scene by scene.",
        },
        {
          q: "Who built Chaka?",
          a: "Emmanuel Ezinna Nweke (Templeton) at Jomiez Innovation. The same team builds custom software and AI systems for businesses.",
        },
        BUILD_WITH_US,
      ],
    },
  },
  {
    slug: "chaka-wap",
    name: "Chaka WAP",
    hero: {
      title: "Chaka WAP: At Home in WhatsApp",
      lead: "A local-first AI that joins WhatsApp conversations as a human-like participant, learning the style of every chat it's in.",
      cta: "Ask About Chaka WAP",
    },
    stats: [
      { value: "10x", text: "Faster reads after moving vectors from strings to binary BLOBs in SQLite." },
      { value: "384-dim", text: "Embeddings generated locally with transformers, for private, cost-free retrieval." },
      { value: "$0", text: "Spent on cloud embedding APIs since they were replaced with local transformers." },
      { value: "5–8", text: "Recent messages read to mirror a person's syntax, capitalisation and slang." },
    ],
    showcase: {
      title: "The Live Console",
      lead: "A real-time dashboard in Vanilla JS, Tailwind and Socket.io for live telemetry and logs, from 4K monitors down to phones.",
      image: "/media/work/chaka-wap.jpg",
      address: "Chaka WAP",
    },
    cards: [
      {
        mock: "research",
        mockTitle: "Learning your style",
        title: "Dynamic Style Learning",
        text: "It reads the last 5–8 messages and mirrors syntax, capitalisation and Nigerian Pidgin, so every reply fits the room.",
      },
      {
        mock: "prompt",
        mockTitle: "Message Chaka on WhatsApp…",
        title: "Ironclad Failover",
        text: "When a model hits its rate limit, the orchestrator rotates versions and keys, and the conversation carries on.",
      },
    ],
    statement:
      "Chaka WAP isn't a bot waiting for commands; it's a participant that remembers the whole relationship and answers in the voice of the people it talks to.",
    system: {
      label: "System: local-first",
      text: "Chaka WAP runs on a decoupled architecture: a WhatsApp Web bridge, a local SQLite memory engine and a multi-LLM orchestrator. Memory stays close, private and fast.",
      features: [
        { icon: "shieldCheck", text: "Local SQLite keeps chat logs and embeddings fast, encrypted and on its own ground." },
        { icon: "brain", text: "A cosine-similarity search pulls relevant history into every reply, so nothing is forgotten." },
        { icon: "gauge", text: "Binary BLOB vectors shrank the database and made reads ten times faster." },
        { icon: "plugsConnected", text: "The routing orchestrator rotates model versions and API keys whenever limits are hit." },
      ],
    },
    faq: {
      sub: "Answers on how Chaka WAP learns, remembers and stays online.",
      title: "Everything you need to know about Chaka WAP.",
      items: [
        {
          q: "What is Chaka WAP?",
          a: "An AI engine that operates autonomously on WhatsApp. Unlike traditional bots, it joins conversations as a human-like participant and mirrors the style of the person it's talking to.",
        },
        {
          q: "How does it learn a person's style?",
          a: "It analyses their last 5–8 messages and mirrors their syntax, capitalisation and use of Nigerian Pidgin.",
        },
        {
          q: "Where does its memory live?",
          a: "Locally. Embeddings are generated with local transformers and stored as binary BLOBs in SQLite, and every reply runs a cosine-similarity search over that history.",
        },
        {
          q: "Can it understand photos?",
          a: "Yes. It is fully multimodal and infers the occasion: why a photo was sent, based on the chat so far. Gemini 1.5 Flash handles vision; Gemini 2.5 Flash handles reasoning.",
        },
        {
          q: "What happens when a model hits its limit?",
          a: "The Ironclad Routing Orchestrator rotates through model versions and API keys, so the conversation keeps going.",
        },
        BUILD_WITH_US,
      ],
    },
  },
];

export function getProductPage(slug: string) {
  return productPages.find((p) => p.slug === slug);
}
