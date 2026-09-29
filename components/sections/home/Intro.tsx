"use client";

import Image from "next/image";
import { Appear, springFirm } from "@/components/ui/Motion";
import { ScrollText } from "@/components/ui/ScrollText";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { Dial } from "@/components/ui/Dial";
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
              text="Automate the manual, accelerate the future. We engineer custom software, apps and AI systems that deliver measurable growth and operational excellence."
            />
            <Appear inView delay={0.1} transition={springFirm}>
              <p className={styles.sub}>
                Empowering modern teams with clean software, intuitive design, and robust engineering.
              </p>
            </Appear>
          </div>

          <div className={styles.bento}>
            <Appear inView delay={0} transition={springFirm} className={`${styles.card} ${styles.dark}`}>
              <div className={styles.cardTop}>
                <span className={styles.iconTile} aria-hidden="true">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <path d="M4 21 12 13l5 5 9-10" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 8h7v7" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className={styles.bigNumber}>80+</p>
              </div>
              <p className={styles.cardText}>
                Projects shipped for startups and growing businesses, from first prototype to production.
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
                <p className={styles.mutedText}>Years building production software.</p>
              </Appear>
            </div>

            <Appear inView delay={0.3} transition={springFirm} className={`${styles.card} ${styles.soft} ${styles.dialCard}`}>
              <Dial />
              <div className={styles.dialText}>
                <h3 className={styles.cardHeading}>Execution speed</h3>
                <p className={styles.mutedText}>Fast, reliable delivery for production-ready deployments.</p>
              </div>
            </Appear>

            <Appear inView delay={0.4} transition={springFirm} className={`${styles.card} ${styles.white}`}>
              <div className={styles.quoteTop}>
                <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
                  <path
                    d="M8 28V19.5C8 14.3 10.6 11 15.6 10l1 2.4c-2.8.9-4.2 2.8-4.3 5.6H17V28H8Zm15 0V19.5c0-5.2 2.6-8.5 7.6-9.5l1 2.4c-2.8.9-4.2 2.8-4.3 5.6H32V28h-9Z"
                    fill="#1a1a1a"
                  />
                </svg>
                <span className={styles.quoteBrand}>Jomiez</span>
              </div>
              <div className={styles.quoteBody}>
                <p className={styles.quote}>
                  We take projects from concept through design, development, launch and ongoing support, so you always
                  have one team accountable for the result.
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
