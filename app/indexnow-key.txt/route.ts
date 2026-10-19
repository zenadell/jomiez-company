import { indexNowKey } from "@/cms/indexnow";

/* The IndexNow key file: how search engines check a ping came from this site (cms/indexnow.ts). */
export const dynamic = "force-dynamic";

export function GET() {
  const key = indexNowKey();
  return new Response(key ?? "Not found", { status: key ? 200 : 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}
