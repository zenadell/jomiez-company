import type { CSSProperties } from "react";
import type { Ctx } from "./context";
import { Brand, Credits, Frame, Hours, Img, MapPic, Nav, Open, Primary, Reach } from "./Shared";
import po from "./poster.module.css";

/*
 * "Loud and flat" (Taste Skill v2, MIT): the directness of a street poster.
 * Flat saturated fields edge to edge, the heaviest type set tight, short
 * blunt statements, photographs hard-cropped and stuck on at an angle. The
 * control under the noise: one grid, three or four colours, exact alignment.
 */
export function Poster({ ctx }: { ctx: Ctx }) {
  const { c, photos } = ctx;
  const lines = c.headline.split(/\s+/);
  return (
    <Frame ctx={ctx} className={po.page}>
      <header className={po.head}>
        <Brand ctx={ctx} />
        <Nav ctx={ctx} />
      </header>
      <main id="top">
        <section className={po.hero}>
          <h1 className={po.title}>
            {lines.map((w, i) => (
              <span key={i}>{w} </span>
            ))}
          </h1>
          {photos[0] && (
            <div className={po.stick}>
              <Img src={photos[0]} priority />
            </div>
          )}
          <div className={po.heroFoot}>
            <p>{c.sub}</p>
            <div className={po.act}>
              <Primary ctx={ctx} className={po.chunky} />
              <Open ctx={ctx} />
            </div>
          </div>
        </section>

        {c.highlights.length > 0 && (
          <section className={po.panels}>
            {c.highlights.map((h, i) => (
              <div key={h.title} className={po.panel} style={{ "--grow": [1.35, 1, 1.15][i] ?? 1 } as CSSProperties}>
                <h2>{h.title}</h2>
                {h.text && <p>{h.text}</p>}
              </div>
            ))}
          </section>
        )}

        <section className={po.list} id="what">
          <p className={po.listHead}>What we do</p>
          {c.services.map((s) => (
            <div key={s.title} className={po.row}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </section>

        <section className={po.about} id="about">
          {photos[1] && <Img src={photos[1]} className={po.bleed} />}
          <div className={po.caption}>
            <h2>About {c.name}</h2>
            <p>{c.statement}</p>
            <p>{c.about}</p>
          </div>
        </section>

        <section className={po.visit} id="visit">
          <div>
            <h2>Come in</h2>
            {ctx.where && <p className={po.where}>{ctx.where}</p>}
            <Reach ctx={ctx} />
          </div>
          <Hours ctx={ctx} className={po.hours} />
          <MapPic ctx={ctx} className={po.map} />
        </section>

        <section className={po.closing}>
          <h2>{c.closing}</h2>
          {photos[2] && (
            <div className={po.stick2}>
              <Img src={photos[2]} />
            </div>
          )}
          <Primary ctx={ctx} className={po.chunkyDark} />
        </section>
      </main>
      <Credits ctx={ctx} className={po.credits} />
    </Frame>
  );
}
