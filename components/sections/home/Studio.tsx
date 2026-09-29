"use client";

import Image from "next/image";
import Link from "next/link";
import { JomiezMark } from "@/components/ui/JomiezMark";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ScrollText } from "@/components/ui/ScrollText";
import styles from "./Studio.module.css";

/* Disciplines, each illustrated by a real Jomiez project. Hover slides in the detail card. */
const DISCIPLINES = [
  {
    name: "Engineering",
    role: "Web & mobile products",
    image: "/media/work/zyro.jpg",
    body: "Websites, web apps, APIs and mobile apps, built to be fast, sturdy and secure.",
    href: "/work/zyro",
  },
  {
    name: "AI Systems",
    role: "Multimodal & voice AI",
    image: "/media/work/chaka-ai.jpg",
    body: "Real-time voice, vision, memory and research, grown in-house in our own Chaka AI.",
    href: "/work/chaka-ai",
  },
  {
    name: "Automation",
    role: "Agents & integrations",
    image: "/media/work/chaka-wap.jpg",
    body: "AI agents that live inside the tools people already use, WhatsApp included.",
    href: "/work/chaka-wap",
  },
  {
    name: "Design",
    role: "UI/UX, brand & motion",
    image: "/media/work/renok.jpg",
    body: "Interfaces, identities and motion that turn still screens into living experiences.",
    href: "/work/renok",
  },
] as const;

export function Studio() {
  return (
    <div className={styles.wrap}>
      <ScrollText
        as="h2"
        className={styles.statement}
        from={0.15}
        text="We are a company of engineers, designers and makers, building our own products and the products of those we believe in."
      />
      <div className={styles.introRow}>
        <span />
        <Appear inView transition={springFirm} className={styles.intro}>
          <p className={styles.introText}>
            One house, many crafts. Every discipline grows from the same roots and answers to the same tenets.
          </p>
          <PixelButton href="/about" variant="secondary">
            Our Story
          </PixelButton>
        </Appear>
      </div>

      <div className={styles.cards}>
        {DISCIPLINES.map((d, i) => (
          <Appear key={d.name} inView delay={i * 0.08} transition={springFirm} className={styles.card}>
            <div className={styles.media}>
              <Image src={d.image} alt="" fill sizes="(max-width: 809px) 100vw, 330px" className={styles.img} />
              <JomiezMark size={20} className={styles.mark} />
            </div>
            <div className={styles.caption}>
              <span className={styles.bar} />
              <div>
                <h3 className={styles.name}>{d.name}</h3>
                <p className={styles.role}>{d.role}</p>
              </div>
            </div>
            <div className={styles.reveal}>
              <p className={styles.revealText}>{d.body}</p>
              <div className={styles.revealFoot}>
                <span className={styles.revealBar} />
                <div>
                  <p className={styles.revealName}>{d.name}</p>
                  <Link href={d.href} className={styles.revealLink}>
                    Explore →
                  </Link>
                </div>
              </div>
            </div>
          </Appear>
        ))}
      </div>
    </div>
  );
}
