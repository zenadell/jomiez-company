"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef } from "react";
import { sendInquiry, type InquiryState } from "@/app/(site)/contact/actions";
import { useSiteData } from "@/components/cms/SiteData";
import { Icon } from "@/components/ui/Icon";
import { Appear, springFirm, springSlow, springSoft } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { src, texts } from "@/lib/media";
import type { ContactPage } from "@/payload-types";
import styles from "./ContactSplit.module.css";

/*
 * The contact form. Messages go to the admin's Inbox through a server action
 * (app/(site)/contact/actions.ts); every word here is set on the admin's
 * Contact page.
 */
export function ContactSplit({ data }: { data: ContactPage["split"] }) {
  const { site } = useSiteData();
  const f = data.form ?? {};
  const budgets = texts(f.budgets);
  const [state, action, pending] = useActionState<InquiryState, FormData>(sendInquiry, { status: "idle" });
  const form = useRef<HTMLFormElement>(null);
  const openedAt = useRef<HTMLInputElement>(null);

  // When the form was opened, for the too-fast-to-be-human check.
  useEffect(() => {
    if (openedAt.current) openedAt.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (state.status === "sent") form.current?.reset();
  }, [state]);

  const err = state.status === "invalid" ? state.errors ?? {} : {};

  return (
    <section className={styles.section}>
      <Appear scale={1.05} transition={springSlow} delay={0.2} className={styles.visual}>
        <Image
          src={src(data.image, "/media/showcase-dial.jpg")}
          alt=""
          fill
          priority
          sizes="(max-width: 1199px) 100vw, 50vw"
          className={styles.img}
        />
        <div className={styles.visualCopy}>
          {data.visualTitle && <h2 className={styles.visualTitle}>{data.visualTitle}</h2>}
          <div className={styles.direct}>
            {site.phone && (
              <a href={site.phoneHref || `tel:${site.phone}`} className={styles.phone}>
                <Icon name="phone" size={16} />
                {site.phone}
              </a>
            )}
            <a href={`mailto:${site.email}`} className={styles.email}>
              {site.email}
            </a>
          </div>
        </div>
      </Appear>

      <div className={styles.formCol}>
        <Appear delay={0.5} transition={springSoft}>
          <h1 className={styles.title}>{data.title}</h1>
        </Appear>
        {data.lead && (
          <Appear delay={0.6} transition={springSoft}>
            <p className={styles.lead}>{data.lead}</p>
          </Appear>
        )}
        <Appear delay={0.7} transition={springFirm}>
          <form ref={form} className={styles.form} action={action} noValidate>
            <div className={styles.twoCol}>
              <label className={styles.field} data-invalid={Boolean(err.name)}>
                <span>{f.nameLabel}</span>
                <input id="contact-name" name="name" type="text" placeholder={f.namePlaceholder ?? ""} autoComplete="name" required maxLength={120} />
                {err.name && <span className={styles.error}>{err.name}</span>}
              </label>
              <label className={styles.field} data-invalid={Boolean(err.email)}>
                <span>{f.emailLabel}</span>
                <input id="contact-email" name="email" type="email" placeholder={f.emailPlaceholder ?? ""} autoComplete="email" required maxLength={200} />
                {err.email && <span className={styles.error}>{err.email}</span>}
              </label>
            </div>
            {budgets.length > 0 && (
              <label className={styles.field}>
                <span>{f.budgetLabel}</span>
                <select id="contact-budget" name="budget" defaultValue={budgets[0]}>
                  {budgets.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.field} data-invalid={Boolean(err.message)}>
              <span>{f.messageLabel}</span>
              <textarea id="contact-message" name="message" rows={4} placeholder={f.messagePlaceholder ?? ""} required maxLength={5000} />
              {err.message && <span className={styles.error}>{err.message}</span>}
            </label>
            {/* Left empty by people; bots fill it in. */}
            <label className={styles.trap} aria-hidden="true">
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
            <input ref={openedAt} type="hidden" name="t" />
            <div className={styles.submitRow}>
              <PixelButton type="submit" disabled={pending}>
                {f.submitLabel || "Send"}
              </PixelButton>
              {state.status === "sent" && (
                <p className={styles.sent} role="status">
                  {f.successMessage}
                </p>
              )}
              {state.status === "error" && (
                <p className={`${styles.sent} ${styles.failed}`} role="alert">
                  {f.errorMessage}
                </p>
              )}
            </div>
          </form>
        </Appear>
      </div>
    </section>
  );
}
