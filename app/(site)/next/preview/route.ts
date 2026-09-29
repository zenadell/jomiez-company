import config from "@payload-config";
import { draftMode, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

/*
 * The admin's preview: signed-in team members only. Turns on Next.js draft
 * mode (pages then read drafts) and opens the page asked for.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "/";
  if (!path.startsWith("/") || path.startsWith("//")) return new Response("Bad path", { status: 400 });

  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) return new Response("Sign in to the admin to preview drafts.", { status: 403 });

  (await draftMode()).enable();
  redirect(path);
}
