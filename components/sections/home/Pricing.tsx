"use client";

import Image from "@/components/ui/Image";
import { motion } from "motion/react";
import { useState } from "react";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Icon } from "@/components/ui/Icon";
import { Appear, springFirm } from "@/components/ui/Motion";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { PixelButton } from "@/components/ui/PixelButton";
import { src, texts } from "@/lib/media";
import type { Home } from "@/payload-types";
import styles from "./Pricing.module.css";

/* Engagement models. Jomiez scopes every project individually, so tiers show "Custom" rather than list prices. */
export function Pricing({ data }: { data: Home["pricing"] }) {
  const [perMilestone, setPerMilestone] = useState(true);
  const b = data.billing ?? {};
  const card = src(data.cardImage, "/media/pricing-swirl.jpg");

  return (
    <section className={styles.section} id="pricing">
      <BigMarquee text={data.marquee} />
      <div className={styles.introRow}>
        <div className={styles.billing}>
          <span>{b.left}</span>
          <button
            type="button"
            role="switch"
            aria-checked={perMilestone}
            aria-label={`Quote per ${(b.right ?? "milestone").toLowerCase()}`}
            className={styles.switch}
            data-on={perMilestone}
            onClick={() => setPerMilestone((v) => !v)}
          >
            <motion.span layout transition={{ type: "spring", duration: 0.4, bounce: 0.2 }} className={styles.knob}>
              <Icon name="check" size={16} />
            </motion.span>
          </button>
          <span>{b.right}</span>
          {b.hint && <span className={styles.flex}>{b.hint}</span>}
        </div>
        <Appear inView transition={springFirm}>
          <p className={styles.intro}>{data.intro}</p>
        </Appear>
      </div>

      <div className={styles.gridWrap}>
        <div className={styles.grid}>
          {(data.tiers ?? []).map((t, i) => (
            <Appear
              key={t.id ?? t.name}
              inView
              delay={i * 0.07}
              transition={springFirm}
              className={`${styles.card} ${t.dark ? styles.dark : ""}`}
            >
              <Image src={card} alt="" fill sizes="340px" className={styles.swirl} />
              <div className={styles.top}>
                <h3 className={styles.name}>{t.name}</h3>
                <div className={styles.priceRow}>
                  <p className={styles.price}>{t.price}</p>
                </div>
                <p className={styles.billingNote}>{perMilestone ? b.rightNote : b.leftNote}</p>
              </div>
              <div className={styles.mid}>
                <p className={styles.blurb}>{t.blurb}</p>
                {t.cta?.label && (
                  <PixelButton href={t.cta.href} variant={t.dark ? "primarySmall" : "secondarySmall"}>
                    {t.cta.label}
                  </PixelButton>
                )}
              </div>
              <ul className={styles.features}>
                {texts(t.features).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Appear>
          ))}
        </div>
      </div>
      {data.showTicker !== false && <NewsTicker className={styles.ticker} />}
    </section>
  );
}
