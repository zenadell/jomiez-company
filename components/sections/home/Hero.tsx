"use client";

import Image from "next/image";
import Link from "next/link";
import { Appear, springFirm, springSlow, springStiff } from "@/components/ui/Motion";
import { Icon } from "@/components/ui/Icon";
import { Marquee } from "@/components/ui/Marquee";
import { PixelButton } from "@/components/ui/PixelButton";
import { ProgressiveBlur } from "@/components/ui/ProgressiveBlur";
import { TechMark } from "@/components/ui/TechMark";
import { stack } from "@/content/home";
import { HeroDew } from "./HeroDew";
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
          <HeroDew src="/media/hero-crt.webp" sizes="100vw" imageClassName={styles.bgImg} className={styles.dew} />
          <div className={styles.shade} />
          <ProgressiveBlur className={styles.bgBlur} direction="up" />
        </Appear>

        <div className={styles.content}>
          <div className={styles.copy}>
            <Appear delay={0.5}>
              <h1 className={styles.title}>
                <span className={styles.muted}>Where intelligence</span>
                <br />
                takes root.
              </h1>
            </Appear>
            <Appear delay={0.6}>
              <p className={styles.lead}>
                A software company growing its own AI products and custom software for businesses, rooted deep and
                built to endure.
              </p>
            </Appear>
            <Appear delay={0.7} transition={springFirm}>
              <PixelButton href="/contact">Start a Project</PixelButton>
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
                  <p className={styles.cardSub}>{"// Our flagship product"}</p>
                </div>
                <span className={styles.cardArrow} aria-hidden="true">
                  <Icon name="arrowRightLight" size={26} />
                </span>
              </div>
            </Link>
          </Appear>
        </div>

        <div className={styles.bottom}>
          <Appear delay={1.1} transition={springFirm}>
            <p className={styles.note}>
              The tools of our craft, chosen as masons choose stone: for strength, and for time.
            </p>
          </Appear>
          <Appear delay={1.2} x={150} transition={springStiff} className={styles.tickerWrap}>
            <Marquee duration={40} gap={10} fade>
              {stack.map((s) => (
                <span key={s} className={styles.stackItem}>
                  <TechMark name={s} />
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
