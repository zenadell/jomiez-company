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
              <h2 className={styles.title}>From a single seed, a living company</h2>
              <PixelButton href="/contact">Contact Us</PixelButton>
            </Appear>
          </div>
          <Appear inView delay={0.1} transition={springFirm} className={styles.copy}>
            <p>
              We are {site.legalName}, a software company of engineers, designers and makers. We grow our own products
              and build for others with the same care: custom software, web and mobile applications and AI systems,
              from the interface down to the infrastructure beneath it.
            </p>
            <p>
              The company is led by {site.founder.name}, known as {site.founder.alias}, our founder and lead engineer.
              He works in React, Next.js, Node.js and Python and builds AI on Gemini, OpenAI and Claude. That work
              took root in our own products: Chaka AI, a multimodal voice assistant, and Chaka WAP, a local-first AI
              engine that lives inside WhatsApp.
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
