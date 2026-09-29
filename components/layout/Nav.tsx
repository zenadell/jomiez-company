"use client";

import { Glass, type GlassOptics } from "@samasante/liquid-glass";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks } from "@/content/site";
import { LogoLink } from "@/components/ui/Logo";
import { PixelButton } from "@/components/ui/PixelButton";
import { GlassText } from "@/components/ui/GlassText";
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
 * Deep, clear liquid glass for the nav pills (github.com/samasante/liquid-glass):
 * the page scrolling underneath swells through a strongly magnifying body and
 * pours around a rainbow-edged rim, under only a whisper of tint. The labels and
 * the burger are cut from the backdrop itself, white over dark and ink over
 * light pixel by pixel (GlassText), so they read over anything. It bends
 * the live page, so it runs where useLiveGlass allows (Chromium with a GPU);
 * elsewhere the pills stay solid white.
 */
const NAV_GLASS: Partial<GlassOptics> = {
  mapSize: 256,
  strength: 0.12,
  depth: 1,
  curvature: 0.6,
  bend: 1,
  bendWidth: 0.36,
  dispersion: 0.45,
  frost: 0.8,
  saturate: 1.4,
  specular: 1.5,
  sheenAngle: 40,
  sheen: 1.2,
  sheenWidth: 3,
  sheenFalloff: 1.4,
  glow: 0.22,
  glowSpread: 1,
  glowFalloff: 0.6,
};

/* The open phone menu: the same clear glass, frosted just enough that the page
   behind doesn't tangle with the big links. */
const MENU_GLASS: Partial<GlassOptics> = { ...NAV_GLASS, frost: 7 };

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
  const label = (text: string) => (glass ? <GlassText>{text}</GlassText> : text);

  // The phone menu has no place on a wide screen: close it if the window widens.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 810px)");
    const close = () => wide.matches && setOpenOn(null);
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);

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
          <Glass optics={open ? MENU_GLASS : NAV_GLASS} className={styles.glass}>
            <span />
          </Glass>
        )}
        <div className={styles.row}>
          <LogoLink />
          <ul className={styles.links}>
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.link} data-active={pathname === l.href}>
                  {label(l.label)}
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
              // On glass the menu only unrolls: fading it would blank the cut-out labels.
              initial={{ height: 0, opacity: glass ? 1 : 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: glass ? 1 : 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
            >
              <ul>
                {navLinks.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: glass ? 1 : 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i + 0.1 }}
                  >
                    <Link href={l.href} className={styles.mobileLink} onClick={() => setOpen(false)}>
                      {label(l.label)}
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
          {label("Hire Us")}
        </PixelButton>
      </motion.div>
    </>
  );
}
