import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { site } from "@/content/site";
import styles from "./Story.module.css";

export function Story() {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.row}>
          <div className={styles.left}>
            <SectionLabel>Our story</SectionLabel>
            <Appear inView transition={springFirm} className={styles.headline}>
              <h2 className={styles.title}>The evolution of engineering at Jomiez</h2>
              <PixelButton href="/contact">Contact Us</PixelButton>
            </Appear>
          </div>
          <Appear inView delay={0.1} transition={springFirm} className={styles.copy}>
            <p>
              We are {site.legalName}: a team of passionate software engineers, designers and strategists committed to
              crafting exceptional digital experiences. We build custom software, web and mobile applications and
              production AI systems, from interface design through backend architecture and deployment.
            </p>
            <p>
              The studio is led by {site.founder.name}, known professionally as {site.founder.alias}, our founder and
              lead engineer. He works primarily in React, Next.js, Node.js and Python, and builds AI products on
              Gemini, OpenAI and Claude, including Chaka AI, a multimodal voice AI platform, and Chaka WAP, a
              local-first AI engine that lives inside WhatsApp.
            </p>
          </Appear>
        </div>

        <dl className={styles.stats}>
          {site.stats.map((s, i) => (
            <Appear key={s.label} inView delay={i * 0.08} transition={springFirm} className={styles.stat}>
              <dt className={styles.value}>{s.value}</dt>
              <dd className={styles.label}>{s.label}</dd>
            </Appear>
          ))}
        </dl>
      </div>
    </section>
  );
}
