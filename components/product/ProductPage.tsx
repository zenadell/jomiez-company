import Image from "next/image";
import { Faq } from "@/components/sections/home/Faq";
import { Icon } from "@/components/ui/Icon";
import { Appear, springFirm, springSlow, springSoft } from "@/components/ui/Motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { ScrollText } from "@/components/ui/ScrollText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { ProductPageData } from "@/content/products";
import { site } from "@/content/site";
import { CountUp } from "./CountUp";
import { PromptMock, ResearchMock } from "./Mockups";
import styles from "./ProductPage.module.css";

const AVATARS = ["/media/clients/client-1.jpg", "/media/clients/client-2.jpg", "/media/clients/client-3.jpg", "/media/clients/client-4.jpg"];
const CARD_ART = ["/media/product/card-1.jpg", "/media/product/card-2.jpg"];
const CARD_SIZES = "(max-width: 1199px) 100vw, 50vw";
const CARD_SHADE = "linear-gradient(180deg, rgba(84, 84, 84, 0) 0%, var(--dark) 70.93%)";

/*
 * A Jomiez product page, built on the template's "Digital Brain" layout:
 * dark hero, stat row, a showcase panel with the product in a browser frame,
 * two feature cards with UI mockups, a scroll-revealed statement beside the
 * system notes, then the product FAQ.
 */
export function ProductPage({ product }: { product: ProductPageData }) {
  const cta = { label: product.hero.cta, href: "/contact" };

  return (
    <>
      <section className={styles.heroSection}>
        <Appear className={styles.hero} scale={1.04} transition={springSlow} delay={0.1}>
          <Image src="/media/product/hero.jpg" alt="" fill priority sizes="100vw" className={styles.heroImg} />
          <div className={styles.heroShade} />
          <div className={styles.heroContent}>
            <Appear delay={0.5} transition={springSoft} className={styles.proof}>
              <span className={styles.avatars}>
                {AVATARS.map((src, i) => (
                  <span key={src} className={styles.avatar} style={{ zIndex: AVATARS.length - i }}>
                    <Image src={src} alt="" width={36} height={36} />
                  </span>
                ))}
              </span>
              <p className={styles.proofText}>
                From the makers of
                <br />
                {site.stats[1].value} delivered projects
              </p>
            </Appear>
            <Appear delay={0.6} transition={springSoft}>
              <h1 className={styles.heroTitle}>{product.hero.title}</h1>
            </Appear>
            <Appear delay={0.7} transition={springSoft}>
              <p className={styles.heroLead}>{product.hero.lead}</p>
            </Appear>
            <Appear delay={0.8} transition={springFirm}>
              <PixelButton href={cta.href} variant="light">
                {cta.label}
              </PixelButton>
            </Appear>
          </div>
        </Appear>
      </section>

      <section className={styles.stats}>
        {product.stats.map((s, i) => (
          <Appear key={s.value} inView delay={i * 0.08} transition={springFirm} className={styles.stat}>
            <p className={styles.statValue}>
              <CountUp value={s.value} />
            </p>
            <p className={styles.statText}>{s.text}</p>
          </Appear>
        ))}
      </section>

      <section className={styles.showcaseSection}>
        <div className={styles.showcase}>
          <Image src="/media/product/panel.jpg" alt="" fill sizes="100vw" className={styles.showcaseBg} />
          <Appear inView transition={springFirm} className={styles.showcaseHead}>
            <h2 className={styles.showcaseTitle}>{product.showcase.title}</h2>
            <p className={styles.showcaseLead}>{product.showcase.lead}</p>
          </Appear>
          <Appear inView y={80} delay={0.1} transition={springSlow} className={styles.browser}>
            <div className={styles.chrome} aria-hidden="true">
              <span className={styles.lights}>
                <i />
                <i />
                <i />
              </span>
              <span className={styles.chromeTools}>
                <Icon name="sidebarSimple" size={20} />
                <Icon name="caretLeft" size={16} />
                <Icon name="caretRight" size={16} />
              </span>
              <span className={styles.chromeCenter}>
                <Icon name="shield" size={18} />
                <span className={styles.address}>
                  <Icon name="lockSimple" size={12} />
                  {product.showcase.address}
                  <Icon name="arrowClockwise" size={13} className={styles.reload} />
                </span>
              </span>
              <span className={styles.chromeTools}>
                <Icon name="downloadSimple" size={18} />
                <Icon name="export" size={18} />
                <Icon name="plus" size={18} />
                <Icon name="copy" size={18} />
              </span>
            </div>
            <div className={styles.screen}>
              <Image
                src={product.showcase.image}
                alt={`${product.name} interface`}
                fill
                sizes="(max-width: 809px) 100vw, 1260px"
                className={styles.screenImg}
              />
            </div>
          </Appear>
        </div>
      </section>

      <section className={styles.cards}>
        {product.cards.map((c, i) => (
          <Appear key={c.title} inView delay={i * 0.08} transition={springFirm} className={styles.card} data-glass-frame="">
            <Image src={CARD_ART[i % CARD_ART.length]} alt="" fill sizes={CARD_SIZES} className={styles.cardBg} />
            <div className={styles.cardShade} style={{ background: CARD_SHADE }} />
            <div className={styles.cardMock}>
              {c.mock === "research" ? (
                <ResearchMock title={c.mockTitle} art={{ src: CARD_ART[i % CARD_ART.length], sizes: CARD_SIZES, shade: CARD_SHADE }} />
              ) : (
                <PromptMock placeholder={c.mockTitle} art={{ src: CARD_ART[i % CARD_ART.length], sizes: CARD_SIZES, shade: CARD_SHADE }} />
              )}
            </div>
            <div className={styles.cardCopy}>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardText}>{c.text}</p>
            </div>
          </Appear>
        ))}
      </section>

      <section className={styles.panelSection}>
        <div className={styles.panel}>
          <div className={styles.system}>
            <div className={styles.statementCol}>
              <ScrollText as="h2" className={styles.statement} from={0.15} text={product.statement} />
              <Appear inView transition={springFirm}>
                <PixelButton href={cta.href}>{cta.label}</PixelButton>
              </Appear>
            </div>
            <div className={styles.systemCol}>
              <SectionLabel reverse>{product.system.label}</SectionLabel>
              <Appear inView transition={springFirm}>
                <p className={styles.systemText}>{product.system.text}</p>
              </Appear>
              <div className={styles.features}>
                {product.system.features.map((f, i) => (
                  <Appear key={f.text} inView delay={i * 0.06} transition={springFirm} className={styles.feature}>
                    <span className={styles.featureIcon}>
                      <Icon name={f.icon} size={26} />
                    </span>
                    <p className={styles.featureText}>{f.text}</p>
                  </Appear>
                ))}
              </div>
            </div>
          </div>
          <Faq label="Common queries" sub={product.faq.sub} title={product.faq.title} items={product.faq.items} cta={cta} />
        </div>
      </section>
    </>
  );
}
