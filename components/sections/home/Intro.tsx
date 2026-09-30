"use client";

import Image from "next/image";
import { Appear, springFirm } from "@/components/ui/Motion";
import { ScrollText } from "@/components/ui/ScrollText";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { Dial } from "@/components/ui/Dial";
import { Icon } from "@/components/ui/Icon";
import { JomiezIcon } from "@/components/ui/JomiezMark";
import { useSiteData } from "@/components/cms/SiteData";
import { src } from "@/lib/media";
import type { Home } from "@/payload-types";
import styles from "./Intro.module.css";

export function Intro({ data }: { data: Home["intro"] }) {
  const { site } = useSiteData();
  const AVATARS = (site.avatars ?? []).map((a) => src(a)).filter(Boolean);
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.stack}>
          <div className={styles.head}>
            <ScrollText className={styles.statement} text={data.statement} />
            {data.sub && (
              <Appear inView delay={0.1} transition={springFirm}>
                <p className={styles.sub}>{data.sub}</p>
              </Appear>
            )}
          </div>

          <div className={styles.bento}>
            <Appear inView delay={0} transition={springFirm} className={`${styles.card} ${styles.dark}`}>
              <div className={styles.cardTop}>
                <span className={styles.iconTile} aria-hidden="true">
                  <Icon name="trendUpLight" size={30} style={{ color: "#1f1f1f" }} />
                </span>
                <p className={styles.bigNumber}>{data.projects?.value}</p>
              </div>
              <p className={styles.cardText}>{data.projects?.text}</p>
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
                  <strong>{data.satisfaction?.value}</strong> {data.satisfaction?.label}
                </p>
              </Appear>
              <Appear inView delay={0.2} transition={springFirm} className={`${styles.card} ${styles.soft} ${styles.inline}`}>
                <p className={styles.midNumber}>{data.years?.value}</p>
                <p className={styles.mutedText}>{data.years?.text}</p>
              </Appear>
            </div>

            <Appear inView delay={0.3} transition={springFirm} className={`${styles.card} ${styles.soft} ${styles.dialCard}`}>
              <Dial />
              <div className={styles.dialText}>
                <h3 className={styles.cardHeading}>{data.speed?.title}</h3>
                <p className={styles.mutedText}>{data.speed?.text}</p>
              </div>
            </Appear>

            <Appear inView delay={0.4} transition={springFirm} className={`${styles.card} ${styles.white}`}>
              <div className={styles.quoteTop}>
                <Icon name="quotesFill" size={40} style={{ color: "#1f1f1f" }} />
                <span className={styles.quoteBrand}>
                  <JomiezIcon size={22} />
                  {data.quote?.brand}
                </span>
              </div>
              <div className={styles.quoteBody}>
                <p className={styles.quote}>{data.quote?.text}</p>
                <p className={styles.quoteBy}>{data.quote?.by}</p>
              </div>
            </Appear>
          </div>
        </div>
        {data.showTicker !== false && <NewsTicker className={styles.ticker} />}
      </div>
    </section>
  );
}
