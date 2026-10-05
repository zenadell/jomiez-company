"use client";

import Link from "next/link";
import { useSiteData } from "@/components/cms/SiteData";
import { JomiezIcon } from "./JomiezMark";
import styles from "./Logo.module.css";

/* The Jomiez wordmark from jomiez.com (heavy weight, slight negative tracking). */
export function Wordmark({ className }: { className?: string }) {
  const { name } = useSiteData().site;
  return <span className={`${styles.wordmark} ${className ?? ""}`}>{name}</span>;
}

/* Nav logo: the Jomiez app icon, where the template shows its pill logo. */
export function LogoLink({ className }: { className?: string }) {
  const { name } = useSiteData().site;
  return (
    <Link href="/" className={`${styles.link} ${className ?? ""}`} aria-label={`${name} home`}>
      <JomiezIcon size={34} />
    </Link>
  );
}
