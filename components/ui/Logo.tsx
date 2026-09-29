import Link from "next/link";
import { JomiezIcon } from "./JomiezMark";
import styles from "./Logo.module.css";

/* The Jomiez wordmark from jomiez.com (heavy weight, slight negative tracking). */
export function Wordmark({ className }: { className?: string }) {
  return <span className={`${styles.wordmark} ${className ?? ""}`}>Jomiez</span>;
}

/* Nav logo: the Jomiez app icon, where the template shows its pill logo. */
export function LogoLink({ className }: { className?: string }) {
  return (
    <Link href="/" className={`${styles.link} ${className ?? ""}`} aria-label="Jomiez home">
      <JomiezIcon size={34} />
    </Link>
  );
}
