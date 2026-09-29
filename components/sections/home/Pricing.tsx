import Image from "next/image";
import { BigMarquee } from "@/components/ui/BigMarquee";
import { Appear, springFirm } from "@/components/ui/Motion";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { PixelButton } from "@/components/ui/PixelButton";
import { pricingTiers } from "@/content/faq";
import styles from "./Pricing.module.css";

/* Engagement models. Jomiez scopes every project individually, so tiers show "Custom" rather than list prices. */
export function Pricing() {
  return (
    <section className={styles.section} id="pricing">
      <BigMarquee text="Pricing" />
      <div className={styles.introRow}>
        <p className={styles.note}>
          <span className={styles.noteDot} />
          Scoped per project
        </p>
        <Appear inView transition={springFirm}>
          <p className={styles.intro}>
            Transparent project scopes designed to scale with your business. Tell us what you are building and we come
            back with scope, timeline and cost. No hidden fees.
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
                <p className={styles.billing}>Quoted per milestone</p>
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
