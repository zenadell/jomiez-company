import type { CollectionConfig } from "payload";
import { publishedOrSignedIn, signedIn } from "../access";
import { image } from "../fields";
import { redirectOldAddress, revalidateAfterDelete, revalidateCollection } from "../hooks";
import { slugField } from "../slug";

/* Journal posts at /insights/<address>. Written in the rich text editor. */
export const Articles: CollectionConfig = {
  slug: "articles",
  labels: { singular: "Journal post", plural: "Journal" },
  admin: {
    group: "Content",
    useAsTitle: "title",
    defaultColumns: ["title", "category", "date", "_status", "updatedAt"],
    description: "Field notes shown on the home page and at /insights. Newest first.",
  },
  defaultSort: "-date",
  access: { read: publishedOrSignedIn, create: signedIn, update: signedIn, delete: signedIn },
  versions: { drafts: { autosave: { interval: 800 }, schedulePublish: false }, maxPerDoc: 50 },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "excerpt", label: "Excerpt", type: "textarea", required: true, admin: { description: "One or two lines for cards and search results." } },
    image("image", "Cover image", undefined, true),
    { name: "body", label: "Article", type: "richText", required: true },
    slugField("title", "/insights/"),
    {
      name: "category",
      label: "Category",
      type: "text",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "author",
      label: "Author",
      type: "text",
      required: true,
      defaultValue: "Jomiez Team",
      admin: { position: "sidebar" },
    },
    {
      name: "date",
      label: "Publish date",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly", displayFormat: "d MMM yyyy" } },
    },
  ],
  hooks: { afterChange: [redirectOldAddress("/insights/"), revalidateCollection], afterDelete: [revalidateAfterDelete] },
};
