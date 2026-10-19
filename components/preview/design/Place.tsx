import type { CSSProperties } from "react";
import type { Ctx } from "./context";
import { aspectOf, fitName } from "./fit";
import { FitText } from "./FitText";
import { A, Credits, Frame, Hours, Img, MapPic, Open, Primary, Reach } from "./Shared";
import p from "./place.module.css";

/*
 * "The place carries it" (Taste Skill v2, MIT): for somewhere people go. One
 * full-screen photograph of where you'd be standing, the name along its
 * bottom edge like a film title, then few words, long pauses and pictures at
 * uneven sizes. Practical details are gathered once, near the end.
 */
export function Place({ ctx }: { ctx: Ctx }) {
  const { c, photos } = ctx;
  const fit = fitName(c.name, { aspect: aspectOf(ctx.type), maxLine: 14, width: 94 });
  // Each photograph once: the hero, a wide one, then a pair only when there are two for it; a single spare goes beside "About".
  const [hero, wide, ...rest] = photos;
  const pair = rest.length >= 3 ? rest.slice(0, 2) : rest.length === 2 ? rest : [];
  const aside = rest.length >= 3 ? rest[2] : rest.length === 1 ? rest[0] : undefined;
  return (
    <Frame ctx={ctx} className={p.page}>
      <main id="top">
        <section className={p.hero}>
          <Img src={hero} priority className={p.heroImg} />
          <div className={p.scrim} aria-hidden="true" />
          <header className={p.head}>
            <p className={p.where}>{[c.kind, c.area?.split(",")[0]].filter(Boolean).join(" in ")}</p>
            <nav className={p.nav} aria-label="Sections">
              <a href="#about">About</a>
              <a href="#visit">Visit</a>
              <A href={ctx.primary} className={p.navAct}>
                {ctx.cta}
              </A>
            </nav>
          </header>
          <div className={p.title}>
            <p className={p.sub}>{c.sub}</p>
            <FitText lines={fit.lines} maxVh={fit.lines.length > 1 ? 17 : 26} className={p.name} style={{ "--size": fit.size } as CSSProperties} label={c.name} />
          </div>
        </section>

        <section className={p.intro}>
          <h2>{c.headline}</h2>
          <p>{c.statement}</p>
          <Open ctx={ctx} />
        </section>

        {wide && <Img src={wide} className={p.wide} />}

        <section className={p.offer} id="what">
          {c.services.map((s) => (
            <div key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </section>

        {pair.length === 2 && (
          <section className={p.pair} aria-label="Photos">
            <Img src={pair[0]} className={p.portrait} />
            <Img src={pair[1]} className={p.land} />
          </section>
        )}

        <section className={p.about} id="about">
          <div>
            <h2>About {c.name}</h2>
            <p>{c.about}</p>
            {c.highlights.length > 0 && (
              <ul>
                {c.highlights.map((h) => (
                  <li key={h.title}>
                    <strong>{h.title}.</strong> {h.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {aside && <Img src={aside} className={p.offset} />}
        </section>

        <section className={p.visit} id="visit">
          <h2>{c.closing}</h2>
          <div className={p.info}>
            <div>
              <h3>Find us</h3>
              {ctx.where && <p>{ctx.where}</p>}
              <Reach ctx={ctx} className={p.reach} />
            </div>
            {ctx.hours.length > 0 && (
              <div>
                <h3>Opening hours</h3>
                <Hours ctx={ctx} />
              </div>
            )}
            <div className={p.act}>
              <Primary ctx={ctx} />
            </div>
          </div>
          <MapPic ctx={ctx} className={p.map} />
        </section>
      </main>
      <Credits ctx={ctx} />
    </Frame>
  );
}
