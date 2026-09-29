import Image from "next/image";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ScrollText } from "@/components/ui/ScrollText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { site } from "@/content/site";
import styles from "./ContactStandard.module.css";

const whatsapp = site.socials.find((s) => s.icon === "whatsapp")!.href;

export function ContactStandard() {
  return (
    <section className={styles.section} id="book">
      <div className={styles.panel}>
        <Appear inView transition={springFirm} className={styles.left}>
          <div className={styles.photo}>
            <Image src="/media/work/chaka-ai.jpg" alt="Chaka AI, built by Jomiez" fill sizes="320px" className={styles.img} />
          </div>
          <p className={styles.location}>Enugu, Nigeria & working worldwide</p>
        </Appear>
        <div className={styles.right}>
          <SectionLabel reverse>Speak with us</SectionLabel>
          <ScrollText
            as="h2"
            className={styles.title}
            text="Rooted in craft, growing software that businesses and people rely on."
          />
          <p className={styles.body}>
            Prefer to talk it through? Send us a few times that suit you and we will set up a call to walk through your
            project in detail.
          </p>
          <ul className={styles.socials}>
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener" aria-label={s.label}>
                  <SocialIcon name={s.icon} size={16} />
                </a>
              </li>
            ))}
          </ul>
          <PixelButton href={whatsapp} newTab>
            Book a call
          </PixelButton>
        </div>
      </div>
    </section>
  );
}
