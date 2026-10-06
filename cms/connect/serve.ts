import config from "@payload-config";
import { after } from "next/server";
import { getPayload } from "payload";
import { originOf } from "../preview";
import { authenticate, refused } from "./auth";
import type { Ctx } from "./ops";

/*
 * What the web API and the MCP server share: check the access key, then hand
 * the operations a context to work in. Browsers can't use these endpoints from
 * another site (no CORS, and a foreign Origin is refused), so a key only ever
 * works from a program that holds it.
 */

export const noStore = { "cache-control": "no-store" };

export async function connect(req: Request): Promise<{ ctx: Ctx } | { refusal: Response }> {
  const payload = await getPayload({ config });
  const origin = req.headers.get("origin");
  if (origin && origin !== originOf(req.headers)) {
    return { refusal: Response.json({ error: "Not allowed from a web page on another site." }, { status: 403, headers: noStore }) };
  }
  const who = await authenticate(payload, req.headers);
  if (refused(who)) return { refusal: Response.json({ error: who.error }, { status: who.status, headers: { ...noStore, ...who.headers } }) };
  return {
    ctx: {
      ...who,
      payload,
      origin: originOf(req.headers),
      keepAlive: (work) => after(() => work.catch(() => undefined)),
    },
  };
}
