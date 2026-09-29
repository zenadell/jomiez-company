"use client";

import Image from "next/image";
import { Appear, springFirm } from "@/components/ui/Motion";
import { ScrollText } from "@/components/ui/ScrollText";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { Dial } from "@/components/ui/Dial";
import { Icon } from "@/components/ui/Icon";
import { JomiezIcon } from "@/components/ui/JomiezMark";
import { site } from "@/content/site";
import styles from "./Intro.module.css";

const AVATARS = ["/media/clients/client-1.jpg", "/media/clients/client-2.jpg", "/media/clients/client-3.jpg", "/media/clients/client-4.jpg"];

export function Intro() {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.stack}>
          <div className={styles.head}>
            <ScrollText
              className={styles.statement}
              text="Trends wither; craft endures. In a world overgrown with noise, we grow software with deep roots, made to outlast the season."
            />
            <Appear inView delay={0.1} transition={springFirm}>
              <p className={styles.sub}>
                A software company of engineers and designers, building our own products and the products of those we
                believe in.
              </p>
            </Appear>
          </div>

          <div className={styles.bento}>
            <Appear inView delay={0} transition={springFirm} className={`${styles.card} ${styles.dark}`}>
              <div className={styles.cardTop}>
                <span className={styles.iconTile} aria-hidden="true">
                  <Icon name="trendUpLight" size={30} style={{ color: "#1f1f1f" }} />
                </span>
                <p className={styles.bigNumber}>80+</p>
              </div>
              <p className={styles.cardText}>
                Projects grown from first sketch to production, for founders, businesses and our own product line.
              </p>
            </Appear>

            <div className={styles.col}>
              <Appear inView delay={0.1} transition={springFirm} className={`${styles.card} ${styles.outline}`}>
                <div className={styles.avatars}>
                  {AVATARS.map((src, i) => (
                    <span key={src} className={styles.avatar} style={{ zIndex: AVATARS.length - i }}>
                      <Image src={src} alt="" width={52} height={52} />
                    </span>
                  ))}
                </div>
                <p className={styles.avatarNote}>
                  <strong>100%</strong> client satisfaction
                </p>
              </Appear>
              <Appear inView delay={0.2} transition={springFirm} className={`${styles.card} ${styles.soft} ${styles.inline}`}>
                <p className={styles.midNumber}>7+</p>
                <p className={styles.mutedText}>Years of craft, and still growing.</p>
              </Appear>
            </div>

            <Appear inView delay={0.3} transition={springFirm} className={`${styles.card} ${styles.soft} ${styles.dialCard}`}>
              <Dial />
              <div className={styles.dialText}>
                <h3 className={styles.cardHeading}>Swift by nature</h3>
                <p className={styles.mutedText}>Steady, reliable delivery from first commit to production.</p>
              </div>
            </Appear>

            <Appear inView delay={0.4} transition={springFirm} className={`${styles.card} ${styles.white}`}>
              <div className={styles.quoteTop}>
                <Icon name="quotesFill" size={40} style={{ color: "#1f1f1f" }} />
                <span className={styles.quoteBrand}>
                  <JomiezIcon size={22} />
                  Jomiez
                </span>
              </div>
              <div className={styles.quoteBody}>
                <p className={styles.quote}>
                  We don&apos;t chase what&apos;s fashionable. We plant ideas, tend them with patience, and build
                  software meant to stand for years.
                </p>
                <p className={styles.quoteBy}>
                  {site.founder.alias}, {site.founder.role}
                </p>
              </div>
            </Appear>
          </div>
        </div>
        <NewsTicker className={styles.ticker} />
      </div>
    </section>
  );
}
