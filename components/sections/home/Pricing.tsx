"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState } from "react";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Icon } from "@/components/ui/Icon";
import { Appear, springFirm } from "@/components/ui/Motion";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { PixelButton } from "@/components/ui/PixelButton";
import { pricingTiers } from "@/content/faq";
import styles from "./Pricing.module.css";

/* Engagement models. Jomiez scopes every project individually, so tiers show "Custom" rather than list prices. */
export function Pricing() {
  const [perMilestone, setPerMilestone] = useState(true);

  return (
    <section className={styles.section} id="pricing">
      <BigMarquee text="Pricing" />
      <div className={styles.introRow}>
        <div className={styles.billing}>
          <span>Per Sprint</span>
          <button
            type="button"
            role="switch"
            aria-checked={perMilestone}
            aria-label="Quote per milestone"
            className={styles.switch}
            data-on={perMilestone}
            onClick={() => setPerMilestone((v) => !v)}
          >
            <motion.span layout transition={{ type: "spring", duration: 0.4, bounce: 0.2 }} className={styles.knob}>
              <Icon name="check" size={16} />
            </motion.span>
          </button>
          <span>Milestone</span>
          <span className={styles.flex}>(Flexible)</span>
        </div>
        <Appear inView transition={springFirm}>
          <p className={styles.intro}>
            Every build is scoped by hand. Tell us what you are growing and we return with scope, timeline and cost.
            No hidden terms.
          </p>
        </Appear>
      </div>

      <div className={styles.gridWrap}>
        <div className={styles.grid}>
          {pricingTiers.map((t, i) => (
            <Appear
              key={t.name}
              inView
              delay={i * 0.07}
              transition={springFirm}
              className={`${styles.card} ${t.dark ? styles.dark : ""}`}
            >
              <Image src="/media/pricing-swirl.jpg" alt="" fill sizes="340px" className={styles.swirl} />
              <div className={styles.top}>
                <h3 className={styles.name}>{t.name}</h3>
                <div className={styles.priceRow}>
                  <p className={styles.price}>Custom</p>
                </div>
                <p className={styles.billingNote}>{perMilestone ? "Quoted per milestone" : "Quoted per sprint"}</p>
              </div>
              <div className={styles.mid}>
                <p className={styles.blurb}>{t.blurb}</p>
                <PixelButton href="/contact" variant={t.dark ? "primarySmall" : "secondarySmall"}>
                  Get a quote
                </PixelButton>
              </div>
              <ul className={styles.features}>
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Appear>
          ))}
        </div>
      </div>
      <NewsTicker className={styles.ticker} />
    </section>
  );
}
