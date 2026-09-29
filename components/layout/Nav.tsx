"use client";

import { Glass, type GlassOptics } from "@samasante/liquid-glass";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks } from "@/content/site";
import { LogoLink } from "@/components/ui/Logo";
import { PixelButton } from "@/components/ui/PixelButton";
import { ProgressiveBlur } from "@/components/ui/ProgressiveBlur";
import { useLiveGlass } from "@/components/ui/useGlassSupport";
import styles from "./Nav.module.css";

// Framer appear effect for the nav: drops 100px, spring 0.8s, no bounce, 0.5s delay.
const DROP = {
  initial: { opacity: 0.001, y: -100 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", duration: 0.8, bounce: 0, delay: 0.5 },
} as const;

/*
 * Thick liquid glass for the nav pills (github.com/samasante/liquid-glass): the
 * page scrolling underneath swells through the middle and pours around a deep,
 * rainbow-edged rim, under a milky veil that keeps the links readable. It bends
 * the live page, so it runs where useLiveGlass allows (Chromium with a GPU);
 * elsewhere the pills stay solid white.
 */
const NAV_GLASS: Partial<GlassOptics> = {
  mapSize: 256,
  strength: 0.075,
  depth: 0.8,
  curvature: 0.55,
  bend: 0.9,
  bendWidth: 0.3,
  dispersion: 1,
  frost: 2,
  saturate: 1.35,
  specular: 1.4,
  sheenAngle: 40,
  sheen: 1.1,
  sheenWidth: 3,
  sheenFalloff: 1.4,
  glow: 0.25,
  glowSpread: 1,
  glowFalloff: 0.6,
};

export function Nav() {
  const pathname = usePathname();
  // The menu remembers the path it was opened on, so navigating anywhere closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  // The pills turn to glass once they've dropped in: while the drop fades them in,
  // their opacity would cut the glass off from the page it bends.
  const live = useLiveGlass();
  const [dropped, setDropped] = useState(false);
  const glass = live && dropped;

  return (
    <>
      <ProgressiveBlur className={styles.topBlur} direction="down" />

      <motion.nav
        className={styles.pill}
        aria-label="Main"
        data-glass={glass ? "" : undefined}
        onAnimationComplete={() => setDropped(true)}
        {...DROP}
      >
        {glass && (
          <Glass optics={NAV_GLASS} className={styles.glass}>
            <span />
          </Glass>
        )}
        <div className={styles.row}>
          <LogoLink />
          <ul className={styles.links}>
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.link} data-active={pathname === l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.burger}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            <motion.span className={styles.bar} animate={open ? { y: 5.5, rotate: 45 } : { y: 0, rotate: 0 }} />
            <motion.span className={styles.bar} animate={open ? { y: -5.5, rotate: -45 } : { y: 0, rotate: 0 }} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="mobile-menu"
              className={styles.mobileMenu}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
            >
              <ul>
                {navLinks.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i + 0.1 }}
                  >
                    <Link href={l.href} className={styles.mobileLink} onClick={() => setOpen(false)}>
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className={styles.mobileCta}>
                <PixelButton href="/contact" variant="primary">
                  Hire Us
                </PixelButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <motion.div className={styles.hire} data-glass={glass ? "" : undefined} {...DROP}>
        {glass && (
          <Glass optics={NAV_GLASS} className={styles.glass}>
            <span />
          </Glass>
        )}
        <PixelButton href="/contact" variant="primarySmall" className={styles.hireBtn}>
          Hire Us
        </PixelButton>
      </motion.div>
    </>
  );
}
