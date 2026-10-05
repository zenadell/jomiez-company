import Image from "@/components/ui/Image";
import { Appear, springFirm } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ScrollText } from "@/components/ui/ScrollText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { img } from "@/lib/media";
import type { ContactPage, Site } from "@/payload-types";
import styles from "./ContactStandard.module.css";

export function ContactStandard({ data, site }: { data: ContactPage["call"]; site: Site }) {
  const photo = img(data.image);
  return (
    <section className={styles.section} id="book">
      <div className={styles.panel}>
        <Appear inView transition={springFirm} className={styles.left}>
          <div className={styles.photo}>
            {photo && <Image src={photo.src} alt={photo.alt} fill sizes="320px" className={styles.img} />}
          </div>
          {site.location && <p className={styles.location}>{site.location}</p>}
        </Appear>
        <div className={styles.right}>
          <SectionLabel reverse>{data.label}</SectionLabel>
          <ScrollText as="h2" className={styles.title} text={data.title} />
          {data.body && <p className={styles.body}>{data.body}</p>}
          {data.showSocials !== false && (site.socials?.length ?? 0) > 0 && (
            <ul className={styles.socials}>
              {site.socials?.map((s) => (
                <li key={s.id ?? s.label}>
                  <a href={s.href} target="_blank" rel="noopener" aria-label={s.label}>
                    <SocialIcon name={s.icon} size={16} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {data.cta?.label && (
            <PixelButton href={data.cta.href} newTab={/^https?:/.test(data.cta.href)}>
              {data.cta.label}
            </PixelButton>
          )}
        </div>
      </div>
    </section>
  );
}
