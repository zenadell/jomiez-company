"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Appear, springFirm, springSlow, springSoft } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { site } from "@/content/site";
import styles from "./ContactSplit.module.css";

const BUDGETS = ["Not sure yet", "Under $2,000", "$2,000 – $5,000", "$5,000 – $15,000", "$15,000+"];

/*
 * There is no mail backend yet, so the form composes an email to hello@jomiez.com
 * in the visitor's mail app. Swap handleSubmit for an API route when one exists.
 */
export function ContactSplit() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const budget = String(data.get("budget") ?? "");
    const message = String(data.get("message") ?? "");
    const subject = `New project enquiry from ${name || "the website"}`;
    const body = `Name: ${name}\nEmail: ${email}\nBudget: ${budget}\n\n${message}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <section className={styles.section}>
      <Appear scale={1.05} transition={springSlow} delay={0.2} className={styles.visual}>
        <Image src="/media/showcase-dial.jpg" alt="" fill priority sizes="(max-width: 1199px) 100vw, 50vw" className={styles.img} />
        <div className={styles.visualCopy}>
          <h2 className={styles.visualTitle}>Let&apos;s build your digital product together.</h2>
          <div className={styles.direct}>
            <a href={site.phoneHref} className={styles.phone}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className={styles.email}>
              {site.email}
            </a>
          </div>
        </div>
      </Appear>

      <div className={styles.formCol}>
        <Appear delay={0.5} transition={springSoft}>
          <h1 className={styles.title}>Start your project with Jomiez today.</h1>
        </Appear>
        <Appear delay={0.6} transition={springSoft}>
          <p className={styles.lead}>
            Ready to turn your idea into production-ready software? Tell us what you are building and we will come back
            with scope, timeline and cost.
          </p>
        </Appear>
        <Appear delay={0.7} transition={springFirm}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.twoCol}>
              <label className={styles.field}>
                <span>Name</span>
                <input id="contact-name" name="name" type="text" placeholder="Alex Johnson" autoComplete="name" required />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input id="contact-email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
              </label>
            </div>
            <label className={styles.field}>
              <span>Budget</span>
              <select id="contact-budget" name="budget" defaultValue={BUDGETS[0]}>
                {BUDGETS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Message</span>
              <textarea id="contact-message" name="message" rows={4} placeholder="Tell us about your project…" required />
            </label>
            <div className={styles.submitRow}>
              <PixelButton type="submit">Send enquiry</PixelButton>
              {sent && (
                <p className={styles.sent} role="status">
                  Your email app should open with the message ready. If it doesn&apos;t, write to {site.email}.
                </p>
              )}
            </div>
          </form>
        </Appear>
      </div>
    </section>
  );
}
