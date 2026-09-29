"use client";

import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ScrollText } from "@/components/ui/ScrollText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { site } from "@/content/site";
import styles from "./Mission.module.css";

const FEATURES = [
  { icon: "lens", text: "Intuitive interfaces and high-converting user journeys." },
  { icon: "orbit", text: "Scalable cloud backends and responsive databases." },
  { icon: "bars", text: "Modern web performance and sub-second interactions." },
  { icon: "globe", text: "Global cloud deployment, optimised for performance and scale." },
] as const;

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
            Our mission
          </SectionLabel>
          <ScrollText
            className={styles.statement}
            from={0.15}
            text="We believe that AI should not just automate tasks, but amplify the creative and strategic potential of every human."
          />
          <Appear inView transition={springFirm}>
            <p className={styles.body}>
              By merging engineering rigour with intuitive design, we build digital products that don&apos;t just solve
              problems. They create new opportunities for growth.
            </p>
          </Appear>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featuresHead}>
          <p className={styles.mono}>
            Crafting digital experiences that scale with your ambition. We deliver custom software and AI solutions
            tailored to your business.
          </p>
          <div className={styles.headRight}>
            <div className={styles.bubbles} aria-hidden="true">
              {["code", "spark", "cloud", "phone"].map((k) => (
                <span key={k} className={styles.bubble}>
                  <BubbleIcon name={k} />
                </span>
              ))}
            </div>
            <PixelButton href="/services" variant="secondary">
              Explore our services
            </PixelButton>
          </div>
        </div>
        <div className={styles.featureRow}>
          {FEATURES.map((f, i) => (
            <Appear key={f.icon} inView delay={i * 0.08} transition={springFirm} className={styles.feature}>
              <FeatureIcon name={f.icon} />
              <span className={styles.rule} />
              <p className={styles.featureText}>{f.text}</p>
            </Appear>
          ))}
        </div>
      </div>
    </>
  );
}

function BubbleIcon({ name }: { name: string }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "#1a1a1a", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "code":
      return (
        <svg {...common}>
          <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10Z" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common}>
          <path d="M7 18h10.5a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.5A3.3 3.3 0 0 0 7 18Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="6" y="2.5" width="12" height="19" rx="3" />
          <path d="M11 18.5h2" />
        </svg>
      );
  }
}

/* Small line icons for the feature row, each with a gentle idle animation. */
function FeatureIcon({ name }: { name: string }) {
  return (
    <span className={styles.featureIcon} aria-hidden="true">
      {name === "lens" && (
        <svg width="36" height="55" viewBox="0 0 36 55" fill="none" stroke="#fff" strokeWidth="1.4">
          <circle className={styles.lensGlass} cx="15" cy="20" r="11" />
          <path d="m23 28 9 9" strokeLinecap="round" />
          <path className={styles.lensSpark} d="M29 6v6M26 9h6" strokeLinecap="round" />
        </svg>
      )}
      {name === "orbit" && (
        <svg width="44" height="55" viewBox="0 0 44 55" fill="none" stroke="#fff" strokeWidth="1.4">
          <circle cx="22" cy="28" r="17" strokeOpacity=".5" />
          <circle cx="22" cy="28" r="3.5" fill="#fff" />
          <g className={styles.orbitSpin}>
            <circle cx="22" cy="11" r="3" fill="#fff" stroke="none" />
          </g>
        </svg>
      )}
      {name === "bars" && (
        <svg width="36" height="55" viewBox="0 0 36 55" fill="#fff">
          {[4, 12, 20, 28].map((x, i) => (
            <g key={x}>
              <rect x={x + 3} y="10" width="1" height="44" opacity=".5" />
              <rect className={styles.slider} style={{ animationDelay: `${i * 0.4}s` }} x={x} y="30" width="7" height="3" />
            </g>
          ))}
        </svg>
      )}
      {name === "globe" && (
        <svg width="44" height="55" viewBox="0 0 44 55" fill="none" stroke="#fff" strokeWidth="1.4">
          <circle cx="22" cy="28" r="17" />
          <ellipse className={styles.globeSpin} cx="22" cy="28" rx="7" ry="17" />
          <path d="M5 28h34M8 19h28M8 37h28" strokeOpacity=".6" />
        </svg>
      )}
    </span>
  );
}
