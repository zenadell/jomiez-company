import type { Ctx } from "./context";
import { Brand, Credits, Frame, Hours, Img, MapPic, Nav, Open, Primary, Reach } from "./Shared";
import st from "./split.module.css";

/*
 * "The split stage" (Taste Skill v2, MIT): half the screen is a photograph
 * that stays where it is; the other half is a calm reading column with
 * everything a visitor needs, like sitting in the room while reading about
 * it. For services where trust and clear facts matter.
 */
export function Split({ ctx }: { ctx: Ctx }) {
  const { c, photos } = ctx;
  return (
    <Frame ctx={ctx} className={st.page}>
      <div className={st.stage}>
        <div className={st.still} aria-hidden={photos[0] ? undefined : true}>
          {photos[0] ? <Img src={photos[0]} priority /> : <div className={st.field}>{ctx.initials}</div>}
        </div>

        <main className={st.column} id="top">
          <header className={st.head}>
            <Brand ctx={ctx} />
            <Nav ctx={ctx} />
          </header>

          <section className={st.intro}>
            <h1>{c.headline}</h1>
            <p className={st.lead}>{c.sub}</p>
            <div className={st.act}>
              <Primary ctx={ctx} />
              <Open ctx={ctx} />
            </div>
          </section>

          <section className={st.block}>
            <p className={st.statement}>{c.statement}</p>
          </section>

          <section className={st.block} id="what">
            <h2>What we do</h2>
            <dl className={st.services}>
              {c.services.map((s) => (
                <div key={s.title}>
                  <dt>{s.title}</dt>
                  <dd>{s.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          {photos[1] && <Img src={photos[1]} className={st.inline} />}

          {c.highlights.length > 0 && (
            <section className={st.block}>
              <h2>Why people come to us</h2>
              <div className={st.reasons}>
                {c.highlights.map((h) => (
                  <div key={h.title}>
                    <h3>{h.title}</h3>
                    {h.text && <p>{h.text}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={st.block} id="about">
            <h2>About {c.name}</h2>
            <p>{c.about}</p>
          </section>

          <section className={st.block} id="visit">
            <h2>Visit us</h2>
            {ctx.where && <p className={st.where}>{ctx.where}</p>}
            <Hours ctx={ctx} className={st.hours} />
            <MapPic ctx={ctx} className={st.map} />
            <Reach ctx={ctx} />
          </section>

          <section className={st.closing}>
            <p>{c.closing}</p>
            <Primary ctx={ctx} />
          </section>

          <Credits ctx={ctx} className={st.credits} />
        </main>
      </div>
    </Frame>
  );
}
