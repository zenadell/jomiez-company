import type { Block, CollectionConfig } from "payload";
import { publishedOrSignedIn, signedIn } from "../access";
import { faqItems, image, link } from "../fields";
import { revalidateAfterDelete, revalidateCollection } from "../hooks";
import { slugField } from "../slug";

/* Addresses the site's own pages already use; a new page can't take them. */
export const RESERVED_SLUGS = [
  "about",
  "services",
  "contact",
  "work",
  "insights",
  "privacy-policy",
  "terms-conditions",
  "admin",
  "api",
  "next",
];

const blocks: Block[] = [
  {
    slug: "pageHero",
    labels: { singular: "Page opener", plural: "Page openers" },
    fields: [
      { name: "eyebrow", label: "Small label above", type: "text" },
      { name: "title", label: "Headline", type: "text", required: true },
      { name: "lead", label: "Introduction", type: "textarea" },
      { name: "showCta", label: "Show a button", type: "checkbox", defaultValue: true },
      { ...link("cta", "Button"), admin: { condition: (_, siblings) => Boolean(siblings?.showCta) } },
    ],
  },
  {
    slug: "content",
    labels: { singular: "Text", plural: "Text" },
    fields: [
      { name: "title", label: "Heading (optional)", type: "text" },
      { name: "body", label: "Text", type: "richText", required: true },
    ],
  },
  {
    slug: "imageBand",
    labels: { singular: "Image band", plural: "Image bands" },
    fields: [
      image("image", "Image", undefined, true),
      { name: "lead", label: "Top line", type: "textarea" },
      { name: "pill", label: "Small tag", type: "text" },
      { name: "title", label: "Big title", type: "text", required: true },
    ],
  },
  {
    slug: "list",
    labels: { singular: "Numbered cards", plural: "Numbered cards" },
    fields: [
      { name: "title", label: "Heading", type: "text", required: true },
      {
        name: "items",
        label: "Cards",
        type: "array",
        minRows: 1,
        admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "body", label: "Text", type: "textarea", required: true },
        ],
      },
    ],
  },
  {
    slug: "projects",
    labels: { singular: "Products & work grid", plural: "Products & work grids" },
    fields: [
      { name: "label", label: "Label", type: "text", required: true },
      {
        name: "projects",
        label: "Show these",
        type: "relationship",
        relationTo: "projects",
        hasMany: true,
        required: true,
      },
    ],
  },
  {
    slug: "journal",
    labels: { singular: "Latest journal posts", plural: "Latest journal posts" },
    fields: [
      { name: "title", label: "Giant scrolling title", type: "text", defaultValue: "Journal", required: true },
      { name: "count", label: "How many posts", type: "number", defaultValue: 3, min: 1, max: 12, required: true },
    ],
  },
  {
    slug: "faq",
    labels: { singular: "Questions", plural: "Questions" },
    fields: [
      {
        name: "useSiteFaq",
        label: "Use the questions from the home page",
        type: "checkbox",
        defaultValue: true,
      },
      {
        name: "custom",
        label: "Questions for this page",
        type: "group",
        admin: { condition: (_, siblings) => !siblings?.useSiteFaq },
        fields: [
          { name: "label", label: "Label", type: "text" },
          { name: "sub", label: "Intro line", type: "textarea" },
          { name: "title", label: "Heading", type: "text" },
          faqItems(),
        ],
      },
    ],
  },
  {
    slug: "cta",
    labels: { singular: "Call to action", plural: "Calls to action" },
    fields: [
      { name: "title", label: "Heading", type: "text", required: true },
      { name: "text", label: "Text", type: "textarea" },
      link("cta", "Button"),
    ],
  },
  { slug: "tenets", labels: { singular: "Our tenets", plural: "Our tenets" }, fields: [] },
  { slug: "pricing", labels: { singular: "Pricing", plural: "Pricing" }, fields: [] },
];

/*
 * Brand-new pages, built from the site's own sections. Each lives at
 * /<address> and uses the same nav, footer and effects as the rest of the site.
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Custom page", plural: "Custom pages" },
  admin: {
    group: "Pages",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description: "New pages built from the site's sections. Each one lives at jomiez.com/<address>.",
  },
  access: { read: publishedOrSignedIn, create: signedIn, update: signedIn, delete: signedIn },
  versions: { drafts: { autosave: { interval: 800 }, schedulePublish: false }, maxPerDoc: 50 },
  fields: [
    { name: "title", label: "Page title", type: "text", required: true },
    {
      name: "layout",
      label: "Sections",
      type: "blocks",
      blocks,
      minRows: 1,
      admin: { initCollapsed: false },
    },
    {
      ...slugField("title", "/"),
      validate: (value: unknown) =>
        typeof value === "string" && RESERVED_SLUGS.includes(value)
          ? `"${value}" is already used by the site. Pick another address.`
          : true,
    },
  ],
  hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
};
