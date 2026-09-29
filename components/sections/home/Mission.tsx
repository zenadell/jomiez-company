"use client";

import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ScrollText } from "@/components/ui/ScrollText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { site } from "@/content/site";
import { aiLogos } from "./aiLogos";
import { LensIcon, OrbitIcon, RegionsIcon, SlidersIcon } from "./FeatureIcons";
import styles from "./Mission.module.css";

const FEATURES = [
  { Icon: LensIcon, text: "Interfaces that feel familiar at first touch, and journeys that flow." },
  { Icon: OrbitIcon, text: "Backends with deep roots: scalable, secure and calm under load." },
  { Icon: SlidersIcon, text: "Sub-second interactions, tuned like a well-kept instrument." },
  { Icon: RegionsIcon, text: "Deployed wherever your people are, ready for every season of scale." },
];

export function Mission() {
  return (
    <>
      <div className={styles.mission}>
        <Appear inView transition={springFirm} className={styles.founder}>
          <div className={styles.portrait}>
            <span className={styles.monogram}>T</span>
            {["tl", "tr", "br", "bl"].map((c) => (
              <span key={c} className={`${styles.corner} ${styles[c]}`} aria-hidden="true" />
            ))}
          </div>
          <div className={styles.caption}>
            <p className="t-mono-sm">{site.founder.alias}</p>
            <p className={styles.role}>{site.founder.role}</p>
          </div>
        </Appear>

        <div className={styles.statementCol}>
          <SectionLabel dark reverse>
            Our philosophy
          </SectionLabel>
          <ScrollText
            className={styles.statement}
            from={0.15}
            text="We believe technology should grow like nature: patient in its making, quiet in its strength, and in service of the people who use it."
          />
          <Appear inView transition={springFirm}>
            <p className={styles.body}>
              We build our own products and our clients&apos; with the same hand. Every line is written to last, every
              interface shaped to feel familiar, as if it had always been there.
            </p>
          </Appear>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featuresHead}>
          <p className={styles.mono}>
            We stand on the shoulders of giants, building on the world&apos;s leading AI models and shaping them into
            tools people trust every day.
          </p>
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
            <PixelButton href="/work/chaka-ai" variant="secondary">
              Meet Chaka AI
            </PixelButton>
          </div>
        </div>
        <div className={styles.featureRow}>
          {FEATURES.map(({ Icon, text }, i) => (
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
