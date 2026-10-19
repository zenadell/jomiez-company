import type { CSSProperties } from "react";
import type { Ctx } from "./context";
import { A, Brand, Credits, Frame, Hours, Img, MapPic, Nav, Open, Primary, Reach } from "./Shared";
import ca from "./catalogue.module.css";

/*
 * "The specimen catalogue" (Taste Skill v2, MIT): what they sell, shown like
 * a field guide. Each product alone on a flat colour tile, the same scale,
 * named plainly with its price underneath. Only for businesses whose own
 * product photographs we have.
 */
export function Catalogue({ ctx }: { ctx: Ctx }) {
  const { c, products, photos } = ctx;
  const mosaic = products.slice(0, 5);
  return (
    <Frame ctx={ctx} className={ca.page}>
      <header className={ca.head}>
        <Brand ctx={ctx} />
        <Nav ctx={ctx} />
        <Primary ctx={ctx} className={ca.headBtn} />
      </header>
      <main id="top">
        <section className={ca.hero}>
          <div className={ca.heroText}>
            <h1>{c.headline}</h1>
            <p>{c.sub}</p>
            <Open ctx={ctx} />
          </div>
          <div className={ca.mosaic} aria-hidden="true">
            {mosaic.map((p, i) => (
              <div key={p.url} className={ca.tile} style={{ "--f": `var(--f${(i % 4) + 1})`, "--i": i } as CSSProperties}>
                <Img src={p} priority={i < 2} />
              </div>
            ))}
          </div>
        </section>

        <section className={ca.catalogue} id="what">
          <h2>{c.statement}</h2>
          <ul className={ca.grid}>
            {products.map((p, i) => {
              const link = ctx.ask(p.title ? `the ${p.title}${p.price ? ` (${p.price})` : ""}` : "one of your pieces");
              return (
                <li key={p.url} className={i % 7 === 0 && i > 0 ? ca.double : undefined}>
                  <div className={ca.tile} style={{ "--f": `var(--f${(i % 4) + 1})` } as CSSProperties}>
                    <Img src={p} alt={p.title ?? ""} />
                  </div>
                  <div className={ca.cap}>
                    {p.title && <h3>{p.title}</h3>}
                    {p.price && <p>{p.price}</p>}
                    {link && (
                      <A href={link} className={ca.ask}>
                        {ctx.wa ? "Ask about this" : "Call about this"}
                      </A>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={ca.how}>
          {c.services.map((s) => (
            <div key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </section>

        <section className={ca.about} id="about">
          <div>
            <h2>About {c.name}</h2>
            <p>{c.about}</p>
          </div>
          {photos[0] && <Img src={photos[0]} className={ca.room} />}
        </section>

        <section className={ca.visit} id="visit">
          <div>
            <h2>{c.closing}</h2>
            {ctx.where && <p className={ca.where}>{ctx.where}</p>}
            <Hours ctx={ctx} className={ca.hours} />
            <Reach ctx={ctx} />
          </div>
          <MapPic ctx={ctx} className={ca.map} />
        </section>
      </main>
      <Credits ctx={ctx} />
    </Frame>
  );
}
