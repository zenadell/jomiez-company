import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/* Leaves preview mode and shows the published site again. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const path = new URL(request.url).searchParams.get("path") || "/";
  redirect(path.startsWith("/") && !path.startsWith("//") ? path : "/");
}
