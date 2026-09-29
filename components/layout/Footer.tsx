"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { footerColumns, site } from "@/content/site";
import { Wordmark } from "@/components/ui/Logo";
import { PixelButton } from "@/components/ui/PixelButton";
import { SocialIcon } from "@/components/ui/SocialIcon";
import styles from "./Footer.module.css";

/*
 * Reveal footer: fixed behind the page (z-index 1) and uncovered by a
 * transparent spacer after the content. The giant wordmark rises as it's revealed.
 */
export function Footer() {
  const spacer = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: spacer, offset: ["start end", "end end"] });
  const wordY = useTransform(scrollYProgress, [0, 1], ["45%", "0%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [80, 0]);

  return (
    <>
      <div ref={spacer} className={styles.spacer} aria-hidden="true" />
      <footer className={styles.footer}>
        <Image src="/media/footer-cube.webp" alt="" fill sizes="100vw" className={styles.bg} />
        <motion.div className={styles.inner} style={{ y: contentY }}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label="Jomiez home">
              <Wordmark className={styles.logoMark} />
            </Link>
            <p className={styles.blurb}>
              Get in touch with {site.legalName} to bring your digital vision to life with precision and speed.
            </p>
            <div className={styles.contactPill}>
              <a href={`mailto:${site.email}`} className={styles.contactEmail}>
                {site.email}
              </a>
              <PixelButton href="/contact" variant="primarySmall">
                Start a project
              </PixelButton>
            </div>
            <div className={styles.follow}>
              <p className="t-mono-sm">Follow us:</p>
              <ul className={styles.socials}>
                {site.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener" aria-label={s.label} className={styles.social}>
                      <SocialIcon name={s.icon} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.columns}>
            {footerColumns.map((col) => (
              <div key={col.title} className={styles.col}>
                <p className={styles.colTitle}>{col.title}</p>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
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

        <motion.div className={styles.giant} style={{ y: wordY }} aria-hidden="true">
          <svg viewBox="0 0 1000 250" preserveAspectRatio="xMidYMax meet">
            <text x="500" y="228" textAnchor="middle" className={styles.giantText}>
              Jomiez
            </text>
          </svg>
        </motion.div>

        <p className={styles.copy}>
          © {new Date().getFullYear()} {site.legalName}. All rights reserved.
        </p>
      </footer>
    </>
  );
}
