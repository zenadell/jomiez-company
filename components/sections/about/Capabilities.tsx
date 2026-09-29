import { Appear, springFirm } from "@/components/ui/Motion";
import { Marquee } from "@/components/ui/Marquee";
import { ScrollText } from "@/components/ui/ScrollText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { stack } from "@/content/home";
import { TechMark } from "@/components/ui/TechMark";
import styles from "./Capabilities.module.css";

const CARDS = [
  {
    title: "Software Strategy",
    body: "We define the roadmap for your digital platforms, with modular architecture and long-term scalability in mind.",
    shape: "M12 4h14v14H12zM30 22h14v14H30zM12 30a8 8 0 1 0 16 0 8 8 0 1 0-16 0",
  },
  {
    title: "Full-Stack Development",
    body: "Fast, reactive web and mobile applications with low latency and modern frameworks.",
    shape: "M8 8h32L8 40h32M24 8v32",
  },
  {
    title: "AI & Automation",
    body: "Tailored AI assistants, multimodal agents and automated workflows that lift your operations.",
    shape: "M24 6a18 18 0 1 0 0 36 18 18 0 1 0 0-36M24 16a8 8 0 1 0 0 16 8 8 0 1 0 0-16",
  },
  {
    title: "Cloud & APIs",
    body: "Robust backend services, secure REST APIs and reliable database structures.",
    shape: "M6 24 24 6l18 18-18 18zM24 16l8 8-8 8-8-8z",
  },
];

export function Capabilities() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionLabel dark reverse>
          Our crafts
        </SectionLabel>
        <ScrollText
          as="h2"
          className={styles.statement}
          from={0.15}
          text="What we learn growing our own products, we bring to yours."
        />
        <p className={styles.lead}>
          Custom software, web and mobile applications and AI integrations: fast, sturdy and secure, from first idea
          to launch and beyond.
        </p>
      </div>
      <Marquee duration={40} gap={10} fade>
        {stack.map((s) => (
          <span key={s} className={styles.stackItem}>
            <TechMark name={s} size={20} />
            {s}
          </span>
        ))}
      </Marquee>
      <div className={styles.cards}>
        {CARDS.map((c, i) => (
          <Appear key={c.title} inView delay={i * 0.08} transition={springFirm} className={styles.card}>
            <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className={styles.icon}>
              <path d={c.shape} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <div>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardBody}>{c.body}</p>
            </div>
          </Appear>
        ))}
      </div>
    </section>
  );
}
