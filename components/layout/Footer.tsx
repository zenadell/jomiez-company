"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useMenus, useSiteData } from "@/components/cms/SiteData";
import { fill, src } from "@/lib/media";
import { JomiezIcon } from "@/components/ui/JomiezMark";
import { Wordmark } from "@/components/ui/Logo";
import { PixelButton } from "@/components/ui/PixelButton";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { GlassWordmark } from "./GlassWordmark";
import styles from "./Footer.module.css";

/*
 * Reveal footer: fixed behind the page (z-index 1) and uncovered by a
 * transparent spacer after the content. The giant wordmark rises as it's revealed.
 * On phones it flows after the content instead (the spacer is hidden).
 */
const FLOWING = "(max-width: 809px)";
/** Clear space between the end of the page and the top of the footer's content. */
const BREATHING_ROOM = 96;

const watchFlowing = (cb: () => void) => {
  const mq = window.matchMedia(FLOWING);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function Footer() {
  const { site, nav, effects } = useSiteData();
  const footer = nav.footer ?? {};
  const { columns } = useMenus();
  const bg = src(footer.background, "/media/footer-cube.webp");
  const spacer = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: spacer, offset: ["start end", "end end"] });
  const wordY = useTransform(scrollYProgress, [0, 1], ["45%", "0%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [80, 0]);

  // The glass wordmark only runs while the footer can be seen. A fixed footer
  // always "intersects" the viewport, so on desktop the reveal spacer decides.
  const flowing = useSyncExternalStore(watchFlowing, () => window.matchMedia(FLOWING).matches, () => false);
  const revealed = useInView(spacer);
  const onScreen = useInView(footerRef);
  const glassActive = effects.footerGlass !== false && (flowing ? onScreen : revealed);
  // The page lifts away exactly far enough to show the whole footer, column titles
  // included, with room to breathe; never more than the screen.
  useEffect(() => {
    const inner = innerRef.current;
    const footerEl = footerRef.current;
    const gap = spacer.current;
    if (!inner || !footerEl || !gap) return;
    const fit = () => {
      if (window.matchMedia(FLOWING).matches) return gap.style.removeProperty("height");
      const bottomPad = parseFloat(getComputedStyle(footerEl).paddingBottom) || 0;
      gap.style.height = `${Math.min(inner.offsetHeight + bottomPad + BREATHING_ROOM, window.innerHeight)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(inner);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);
  const fillTokens = (t: string | null | undefined) =>
    fill(t, { legalName: site.legalName, year: new Date().getFullYear(), name: site.name });

  return (
    <>
      <div ref={spacer} className={styles.spacer} aria-hidden="true" />
      <footer ref={footerRef} className={styles.footer}>
        <Image src={bg} alt="" fill sizes="100vw" className={styles.bg} />
        <motion.div ref={innerRef} className={styles.inner} style={{ y: contentY }}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label={`${site.name} home`}>
              <JomiezIcon size={44} />
              <Wordmark className={styles.logoWord} />
            </Link>
            {footer.blurb && <p className={styles.blurb}>{fillTokens(footer.blurb)}</p>}
            <div className={styles.contactPill}>
              <a href={`mailto:${site.email}`} className={styles.contactEmail}>
                {site.email}
              </a>
              {footer.cta?.label && (
                <PixelButton href={footer.cta.href} variant="primarySmall">
                  {footer.cta.label}
                </PixelButton>
              )}
            </div>
            {(site.socials?.length ?? 0) > 0 && (
              <div className={styles.follow}>
                {footer.followLabel && <p className="t-mono-sm">{footer.followLabel}</p>}
                <ul className={styles.socials}>
                  {site.socials?.map((s) => (
                    <li key={s.id ?? s.label}>
                      <a href={s.href} target="_blank" rel="noopener" aria-label={s.label} className={styles.social}>
                        <SocialIcon name={s.icon} size={20} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.columns}>
            {columns.map((col) => (
              <div key={col.id} className={styles.col}>
                <p className={styles.colTitle}>{col.title}</p>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.id}>
                      <Link href={l.href} className={styles.colLink}>
                        <span className={styles.dash} aria-hidden="true" />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {footer.showWordmark !== false && (
          <motion.div className={styles.giant} style={{ y: wordY }} aria-hidden="true">
            <GlassWordmark text={site.name} active={glassActive} textClassName={styles.giantText} />
          </motion.div>
        )}

        {footer.copyright && <p className={styles.copy}>{fillTokens(footer.copyright)}</p>}
      </footer>
    </>
  );
}
