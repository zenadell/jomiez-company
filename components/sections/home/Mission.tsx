"use client";

import Image from "next/image";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ScrollText } from "@/components/ui/ScrollText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useSiteData } from "@/components/cms/SiteData";
import { img } from "@/lib/media";
import type { Home } from "@/payload-types";
import { aiLogos } from "./aiLogos";
import { LensIcon, OrbitIcon, RegionsIcon, SlidersIcon } from "./FeatureIcons";
import styles from "./Mission.module.css";

/* Each promise gets one of the four animated glyphs, in order. */
const ICONS = [LensIcon, OrbitIcon, SlidersIcon, RegionsIcon];

export function Mission({ data }: { data: Home["mission"] }) {
  const { founder } = useSiteData().site;
  const photo = img(founder?.photo);
  const features = (data.features ?? []).slice(0, 4).map((f, i) => ({ Icon: ICONS[i], text: f.text }));
  return (
    <>
      <div className={styles.mission}>
        <Appear inView transition={springFirm} className={styles.founder}>
          <div className={styles.portrait}>
            {photo ? (
              <Image src={photo.src} alt={photo.alt || founder?.name || ""} fill sizes="320px" style={{ objectFit: "cover", borderRadius: "inherit" }} />
            ) : (
              <span className={styles.monogram}>{founder?.monogram || founder?.alias?.[0]}</span>
            )}
            {["tl", "tr", "br", "bl"].map((c) => (
              <span key={c} className={`${styles.corner} ${styles[c]}`} aria-hidden="true" />
            ))}
          </div>
          <div className={styles.caption}>
            <p className="t-mono-sm">{founder?.alias}</p>
            <p className={styles.role}>{founder?.role}</p>
          </div>
        </Appear>

        <div className={styles.statementCol}>
          <SectionLabel dark reverse>
            {data.label}
          </SectionLabel>
          <ScrollText className={styles.statement} from={0.15} text={data.statement} />
          {data.body && (
            <Appear inView transition={springFirm}>
              <p className={styles.body}>{data.body}</p>
            </Appear>
          )}
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featuresHead}>
          <p className={styles.mono}>{data.modelsIntro}</p>
          <div className={styles.headRight}>
            <ul className={styles.bubbles} aria-label="Models we build on">
              {aiLogos.map((m) => (
                <li key={m.name} className={styles.bubble} title={m.name}>
                  {"mask" in m ? (
                    <span className={styles.logoMask} style={{ maskImage: `url(${m.mask})`, WebkitMaskImage: `url(${m.mask})` }} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={m.path} fill="currentColor" />
                    </svg>
                  )}
                  <span className="sr-only">{m.name}</span>
                </li>
              ))}
            </ul>
            {data.cta?.label && (
              <PixelButton href={data.cta.href} variant="secondary">
                {data.cta.label}
              </PixelButton>
            )}
          </div>
        </div>
        <div className={styles.featureRow}>
          {features.map(({ Icon, text }, i) => (
            <Appear key={text} inView delay={i * 0.08} transition={springFirm} className={styles.feature}>
              <Icon />
              <span className={styles.rule} />
              <p className={styles.featureText}>{text}</p>
            </Appear>
          ))}
        </div>
      </div>
    </>
  );
}
