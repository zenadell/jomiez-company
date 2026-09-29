"use client";

import Image from "next/image";
import Link from "next/link";
import { Appear, springFirm, springSlow, springStiff } from "@/components/ui/Motion";
import { Icon } from "@/components/ui/Icon";
import { Marquee } from "@/components/ui/Marquee";
import { PixelButton } from "@/components/ui/PixelButton";
import { ProgressiveBlur } from "@/components/ui/ProgressiveBlur";
import { TechMark } from "@/components/ui/TechMark";
import { useSiteData } from "@/components/cms/SiteData";
import { img, src, texts } from "@/lib/media";
import type { Home } from "@/payload-types";
import { HeroDew } from "./HeroDew";
import styles from "./Hero.module.css";

export function Hero({ data }: { data: Home["hero"] }) {
  const { site, effects } = useSiteData();
  const stack = texts(site.stack);
  const bg = src(data.background, "/media/hero-crt.webp");
  const card = data.card;
  const shot = img(card?.image);
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <Appear className={styles.bg} scale={1.1} transition={springSlow} delay={0.2}>
          <Image src={bg} alt="" fill priority sizes="100vw" className={styles.bgImg} />
          {effects.heroDew !== false && (
            <HeroDew src={bg} sizes="100vw" imageClassName={styles.bgImg} className={styles.dew} />
          )}
          <div className={styles.shade} />
          <ProgressiveBlur className={styles.bgBlur} direction="up" />
        </Appear>

        <div className={styles.content}>
          <div className={styles.copy}>
            <Appear delay={0.5}>
              <h1 className={styles.title}>
                <span className={styles.muted}>{data.titleMuted}</span>
                <br />
                {data.titleMain}
              </h1>
            </Appear>
            <Appear delay={0.6}>
              <p className={styles.lead}>{data.lead}</p>
            </Appear>
            <Appear delay={0.7} transition={springFirm}>
              {data.cta?.label && <PixelButton href={data.cta.href}>{data.cta.label}</PixelButton>}
            </Appear>
          </div>

          {card?.enabled !== false && card?.title && (
            <Appear x={150} delay={1} transition={springStiff} className={styles.cardWrap}>
              <Link href={card.href || "/work"} className={styles.card}>
                <Image src={src(card.frame, "/media/hero-card.jpg")} alt="" fill sizes="340px" className={styles.cardFrame} />
                <div className={styles.cardMedia}>
                  {shot && (
                    <Image src={shot.src} alt={shot.alt} fill sizes="340px" className={styles.cardShot} />
                  )}
                </div>
                <div className={styles.cardMeta}>
                  <div>
                    <p className={styles.cardTitle}>{card.title}</p>
                    {card.subtitle && <p className={styles.cardSub}>{card.subtitle}</p>}
                  </div>
                  <span className={styles.cardArrow} aria-hidden="true">
                    <Icon name="arrowRightLight" size={26} />
                  </span>
                </div>
              </Link>
            </Appear>
          )}
        </div>

        <div className={styles.bottom}>
          {data.note && (
            <Appear delay={1.1} transition={springFirm}>
              <p className={styles.note}>{data.note}</p>
            </Appear>
          )}
          {data.showStack !== false && stack.length > 0 && (
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
          )}
        </div>
      </div>
    </section>
  );
}
