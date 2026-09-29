"use client";

import Image from "next/image";
import Link from "next/link";
import { Appear, springFirm, springSlow, springStiff } from "@/components/ui/Motion";
import { Marquee } from "@/components/ui/Marquee";
import { PixelButton } from "@/components/ui/PixelButton";
import { ProgressiveBlur } from "@/components/ui/ProgressiveBlur";
import { stack } from "@/content/home";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <Appear className={styles.bg} scale={1.1} transition={springSlow} delay={0.2}>
          <Image
            src="/media/hero-crt.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.bgImg}
          />
          <div className={styles.shade} />
          <ProgressiveBlur className={styles.bgBlur} direction="up" />
        </Appear>

        <div className={styles.content}>
          <div className={styles.copy}>
            <Appear delay={0.5}>
              <h1 className={styles.title}>
                <span className={styles.muted}>Scale your vision.</span>
                <br />
                Build with Jomiez.
              </h1>
            </Appear>
            <Appear delay={0.6}>
              <p className={styles.lead}>
                Custom software, web and mobile apps, and production AI systems, engineered end to end in one
                seamless flow.
              </p>
            </Appear>
            <Appear delay={0.7} transition={springFirm}>
              <PixelButton href="/contact">Get Started</PixelButton>
            </Appear>
          </div>

          <Appear x={150} delay={1} transition={springStiff} className={styles.cardWrap}>
            <Link href="/work/chaka-ai" className={styles.card}>
              <Image src="/media/hero-card.jpg" alt="" fill sizes="340px" className={styles.cardFrame} />
              <div className={styles.cardMedia}>
                <Image
                  src="/media/work/chaka-ai.jpg"
                  alt="Chaka AI interface"
                  fill
                  sizes="340px"
                  className={styles.cardShot}
                />
              </div>
              <div className={styles.cardMeta}>
                <div>
                  <p className={styles.cardTitle}>Chaka AI</p>
                  <p className={styles.cardSub}>{"// Multimodal voice AI"}</p>
                </div>
                <span className={styles.cardArrow} aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M8 18 18 8M10 8h8v8" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              </div>
            </Link>
          </Appear>
        </div>

        <div className={styles.bottom}>
          <Appear delay={1.1} transition={springFirm}>
            <p className={styles.note}>
              Delivering reliable, modern software for fast-growing companies and forward-thinking founders.
            </p>
          </Appear>
          <Appear delay={1.2} x={150} transition={springStiff} className={styles.tickerWrap}>
            <Marquee duration={40} gap={10} fade>
              {stack.map((s) => (
                <span key={s} className={styles.stackItem}>
                  {s}
                </span>
              ))}
            </Marquee>
          </Appear>
        </div>
      </div>
    </section>
  );
}
