import { serveSiteFile } from "@/cms/sites/serve";

/* The files of a preview made from a template (cms/sites/serve.ts). */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; path: string[] }> };

export async function GET(req: Request, { params }: Params) {
  const { slug, path } = await params;
  return serveSiteFile(req, slug, path);
}

export const HEAD = GET;
