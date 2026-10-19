import type { CSSProperties } from "react";
import type { Ctx } from "./context";
import { aspectOf, fitName } from "./fit";
import { FitText } from "./FitText";
import { Brand, Credits, Frame, Hours, Img, MapPic, Nav, Open, Primary, Reach } from "./Shared";
import m from "./monument.module.css";

/*
 * "The name as a monument" (Taste Skill v2, MIT): the name is the headline,
 * set as wide as the screen under one strong photograph. After the first
 * screen the page goes deliberately small and calm, and the name returns once
 * more, inverted, as the footer.
 */
export function Monument({ ctx }: { ctx: Ctx }) {
  const { c, photos } = ctx;
  const fit = fitName(c.name, { aspect: aspectOf(ctx.type), maxLine: 11, width: 95 });
  const footFit = fitName(c.name, { aspect: aspectOf(ctx.type), maxLine: 60, width: 95 });
  return (
    <Frame ctx={ctx} className={m.page}>
      <header className={m.head}>
        <Brand ctx={ctx} className={m.brand} />
        <Nav ctx={ctx} />
      </header>
      <main id="top">
        <section className={m.hero}>
          <div className={m.photo}>{photos[0] ? <Img src={photos[0]} priority /> : <div className={m.field} />}</div>
          <div className={m.band}>
            <div className={m.row}>
              <p className={m.sub}>{c.sub}</p>
              <div className={m.act}>
                <Open ctx={ctx} />
                <Primary ctx={ctx} />
              </div>
            </div>
            <FitText lines={fit.lines} maxVh={fit.lines.length > 1 ? 17 : 28} className={m.name} style={{ "--size": fit.size } as CSSProperties} label={c.name} />
          </div>
        </section>

        <section className={m.statement}>
          <p>{c.statement}</p>
        </section>

        <section className={m.services} id="what">
          <h2 className={m.h2}>{c.headline}</h2>
          <div className={m.list}>
            {c.services.map((s) => (
              <div key={s.title} className={m.item}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {photos[1] && (
          <section className={`${m.pair}${photos[2] ? "" : ` ${m.single}`}`} aria-label="Photos">
            <Img src={photos[1]} className={m.big} />
            {photos[2] && <Img src={photos[2]} className={m.small} />}
          </section>
        )}

        {c.highlights.length > 0 && (
          <section className={m.reasons}>
            {c.highlights.map((h) => (
              <div key={h.title}>
                <h3>{h.title}</h3>
                {h.text && <p>{h.text}</p>}
              </div>
            ))}
          </section>
        )}

        <section className={m.about} id="about">
          <h2 className={m.h2}>About {c.name}</h2>
          <p>{c.about}</p>
        </section>

        <section className={`${m.visit}${ctx.map ? "" : ` ${m.noMap}`}`} id="visit">
          <div className={m.visitText}>
            <h2 className={m.h2}>Visit</h2>
            {ctx.where && <p className={m.where}>{ctx.where}</p>}
            <Hours ctx={ctx} className={m.hours} />
            <Reach ctx={ctx} />
          </div>
          <MapPic ctx={ctx} className={m.map} />
        </section>
      </main>

      <footer className={m.foot}>
        <div className={m.closing}>
          <p>{c.closing}</p>
          <Primary ctx={ctx} className={m.invertBtn} />
        </div>
        <div aria-hidden="true">
          <FitText lines={[c.name]} className={m.footName} style={{ "--size": footFit.size } as CSSProperties} />
        </div>
      </footer>
      <Credits ctx={ctx} />
    </Frame>
  );
}
