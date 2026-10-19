import { ImageResponse } from "next/og";
import { getGlobal } from "@/lib/cms";

/*
 * The sharing card for a page with no image of its own (lib/metadata.ts): the
 * page's title on the site's own colours, 1200×630 as WhatsApp, LinkedIn and X
 * expect. /og?title=… — the title is shown as text, never as markup.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const site = await getGlobal("site").catch(() => null);
  const name = site?.name || "Jomiez";
  const host = (site?.url || "https://www.jomiez.com").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const raw = new URL(req.url).searchParams.get("title")?.trim() || site?.title || name;
  // "About | Jomiez" reads as "About": the name is already on the card.
  const title = raw.replace(new RegExp(`\\s*[|–—-]\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").slice(0, 120) || name;
  const size = title.length > 70 ? 58 : title.length > 40 ? 70 : 84;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", background: "#f0f0f0", color: "#1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: "#1a1a1a" }} />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>{name}</div>
        </div>
        <div style={{ display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 28, color: "rgba(26,26,26,0.6)" }}>
          <div>{site?.description ? site.description.split(/(?<=\.)\s/)[0].slice(0, 80) : "Software & AI"}</div>
          <div style={{ color: "#1a1a1a", fontWeight: 600 }}>{host}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=86400, s-maxage=604800" } },
  );
}
