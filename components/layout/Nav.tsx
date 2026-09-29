"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks } from "@/content/site";
import { LogoLink } from "@/components/ui/Logo";
import { PixelButton } from "@/components/ui/PixelButton";
import { ProgressiveBlur } from "@/components/ui/ProgressiveBlur";
import styles from "./Nav.module.css";

// Framer appear effect for the nav: drops 100px, spring 0.8s, no bounce, 0.5s delay.
const DROP = {
  initial: { opacity: 0.001, y: -100 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", duration: 0.8, bounce: 0, delay: 0.5 },
} as const;

export function Nav() {
  const pathname = usePathname();
  // The menu remembers the path it was opened on, so navigating anywhere closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);

  return (
    <>
      <ProgressiveBlur className={styles.topBlur} direction="down" />

      <motion.nav className={styles.pill} aria-label="Main" {...DROP}>
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

      <motion.div className={styles.hire} {...DROP}>
        <PixelButton href="/contact" variant="primarySmall">
          Hire Us
        </PixelButton>
      </motion.div>
    </>
  );
}
