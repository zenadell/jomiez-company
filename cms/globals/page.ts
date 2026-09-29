import type { Field, GlobalConfig } from "payload";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks";

/*
 * A page of the site as an editable global: drafts with autosave, live preview
 * and version history, published to the live site on "Publish".
 */
export function pageGlobal({
  slug,
  label,
  description,
  fields,
  group = "Pages",
  drafts = true,
}: {
  slug: string;
  label: string;
  description: string;
  fields: Field[];
  group?: string;
  drafts?: boolean;
}): GlobalConfig {
  return {
    slug,
    label,
    admin: { group, description },
    access: { read: signedIn, update: signedIn, readVersions: signedIn },
    versions: drafts ? { drafts: { autosave: { interval: 800 } }, max: 50 } : { max: 50 },
    fields,
    hooks: { afterChange: [revalidateGlobal] },
  };
}
