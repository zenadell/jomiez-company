"use client";

import Image from "@/components/ui/Image";
import Link from "next/link";
import { JomiezMark } from "@/components/ui/JomiezMark";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ScrollText } from "@/components/ui/ScrollText";
import { src } from "@/lib/media";
import type { Home } from "@/payload-types";
import styles from "./Studio.module.css";

/* Disciplines, each illustrated by a real Jomiez project. Hover slides in the detail card. */
export function Studio({ data }: { data: Home["studio"] }) {
  return (
    <div className={styles.wrap}>
      <ScrollText as="h2" className={styles.statement} from={0.15} text={data.statement} />
      <div className={styles.introRow}>
        <span />
        <Appear inView transition={springFirm} className={styles.intro}>
          {data.intro && <p className={styles.introText}>{data.intro}</p>}
          {data.cta?.label && (
            <PixelButton href={data.cta.href} variant="secondary">
              {data.cta.label}
            </PixelButton>
          )}
        </Appear>
      </div>

      <div className={styles.cards}>
        {(data.disciplines ?? []).map((d, i) => (
          <Appear key={d.id ?? d.name} inView delay={i * 0.08} transition={springFirm} className={styles.card}>
            <div className={styles.media}>
              {src(d.image) && (
                <Image src={src(d.image)} alt="" fill sizes="(max-width: 809px) 100vw, 330px" className={styles.img} />
              )}
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
                    {data.exploreLabel}
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
