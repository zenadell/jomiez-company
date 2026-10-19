import type { ReactNode } from "react";
import { OpenNow, Ribbon, StickyBar } from "../PreviewBits";
import type { Ctx } from "./context";
import s from "./shared.module.css";

/*
 * The parts every preview layout shares: the frame (theme, fonts, the Jomiez
 * ribbon, the phone bar), their name or logo, buttons that go to their own
 * number, hours, the map and the photo credits. Each direction
 * (Monument.tsx, Place.tsx, …) composes them in its own way.
 */

const external = (href: string) => (/^https?:/.test(href) ? { target: "_blank", rel: "noopener" } : {});

export function A({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) {
  return (
    <a href={href} className={className} aria-label={label} {...external(href)}>
      {children}
    </a>
  );
}

/** Their logo, or their name set in the display face. */
export function Brand({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  return (
    <a href="#top" className={`${s.brand} ${className}`} aria-label={ctx.c.name}>
      {ctx.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- their own logo
        <img src={ctx.logo.url} alt={ctx.c.name} />
      ) : (
        <span>{ctx.c.name}</span>
      )}
    </a>
  );
}

export function Nav({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  return (
    <nav className={`${s.nav} ${className}`} aria-label="Sections">
      <a href="#what">{ctx.products.length >= 4 ? "Collection" : "Services"}</a>
      <a href="#about">About</a>
      <a href="#visit">Visit</a>
    </nav>
  );
}

/** The main action: their WhatsApp, else a call, else email. */
export function Primary({ ctx, className = "", children }: { ctx: Ctx; className?: string; children?: ReactNode }) {
  return (
    <A href={ctx.primary} className={`${s.btn} ${className}`}>
      {children ?? ctx.cta}
    </A>
  );
}

export function Open({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  if (!ctx.week || !ctx.tz) return null;
  return (
    <span className={`${s.open} ${className}`}>
      <OpenNow week={ctx.week} tz={ctx.tz} />
    </span>
  );
}

export function Hours({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  if (!ctx.hours.length) return null;
  return (
    <dl className={`${s.hours} ${className}`}>
      {ctx.hours.map((l) => (
        <div key={l.days}>
          <dt>{l.days}</dt>
          <dd>{l.hours}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Every way to reach them, as plain links. */
export function Reach({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  return (
    <ul className={`${s.reach} ${className}`}>
      <li>
        <A href={ctx.directions}>Directions</A>
      </li>
      {ctx.wa && (
        <li>
          <A href={ctx.wa}>WhatsApp</A>
        </li>
      )}
      {ctx.tel && ctx.phone && (
        <li>
          <A href={ctx.tel}>{ctx.phone}</A>
        </li>
      )}
      {ctx.mail && ctx.c.email && (
        <li>
          <A href={ctx.mail}>{ctx.c.email}</A>
        </li>
      )}
      {ctx.socials.map((l) => (
        <li key={l.href}>
          <A href={l.href}>{l.label}</A>
        </li>
      ))}
    </ul>
  );
}

export function MapPic({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  if (!ctx.map) return null;
  return (
    <a className={`${s.map} ${className}`} href={ctx.directions} target="_blank" rel="noopener" aria-label={`Directions to ${ctx.c.name}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a map drawn for this preview */}
      <img src={ctx.map} alt="" loading="lazy" />
      <i aria-hidden="true" />
      <small>© OpenStreetMap</small>
    </a>
  );
}

export function Img({ src, className = "", priority, alt = "" }: { src: { url: string; alt?: string } | undefined; className?: string; priority?: boolean; alt?: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element -- their photo, or a credited free photo
  return <img className={className} src={src.url} alt={src.alt ?? alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />;
}

/** The one place the preview mentions Jomiez and the photographers. */
export function Credits({ ctx, className = "" }: { ctx: Ctx; className?: string }) {
  return (
    <p className={`${s.credits} ${className}`}>
      © {new Date().getFullYear()} {ctx.c.name}. Sample homepage by{" "}
      <a href="https://www.jomiez.com" target="_blank" rel="noopener">
        Jomiez
      </a>
      .
      {ctx.credits.length > 0 && (
        <>
          {" "}
          Photos:{" "}
          {ctx.credits.map((p, i) => (
            <span key={p.url}>
              {i > 0 && ", "}
              <a href={p.page} target="_blank" rel="noopener nofollow">
                {p.by}
              </a>{" "}
              on {p.source}
            </span>
          ))}
          .
        </>
      )}
    </p>
  );
}

const ICON = {
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  chat: "M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.5 8.5 0 1 1 21 11.5z",
  pin: "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
};
const Icon = ({ d }: { d: string }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** The theme, the fonts, the Jomiez ribbon above, the call bar on phones below. */
export function Frame({ ctx, className, children }: { ctx: Ctx; className: string; children: ReactNode }) {
  return (
    <div className={`${s.frame} ${className}`} style={ctx.vars}>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {ctx.fonts.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      <Ribbon>
        <p>
          <strong>A free preview</strong>
          <span className="pv-ribbon__long"> Jomiez made for {ctx.c.name}. Every button works, using your own number.</span>
          <span className="pv-ribbon__short"> made for you by Jomiez</span>
        </p>
        <div className="pv-ribbon__actions">
          <a className="pv-ribbon__go" href={ctx.ownerWa}>
            Get this website
          </a>
          <a className="pv-ribbon__no" href={ctx.stop}>
            Not interested
          </a>
        </div>
      </Ribbon>
      {children}
      <StickyBar>
        {ctx.tel && (
          <a href={ctx.tel}>
            <Icon d={ICON.phone} />
            Call
          </a>
        )}
        {ctx.wa && (
          <a href={ctx.wa} className="is-main" target="_blank" rel="noopener">
            <Icon d={ICON.chat} />
            WhatsApp
          </a>
        )}
        <a href={ctx.directions} target="_blank" rel="noopener">
          <Icon d={ICON.pin} />
          Directions
        </a>
      </StickyBar>
    </div>
  );
}
