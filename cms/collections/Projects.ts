import type { CollectionConfig } from "payload";
import { publishedOrSignedIn, signedIn } from "../access";
import { faqItems, image, link, stats, strings } from "../fields";
import { revalidateAfterDelete, revalidateCollection } from "../hooks";
import { slugField } from "../slug";

/* The icons a product's system notes can use: the site's own icon set (components/ui/Icon.tsx). */
export const FEATURE_ICONS = [
  "arrowRightLight",
  "arrowRight",
  "trendUpLight",
  "rocketLight",
  "quotesFill",
  "timer",
  "xBold",
  "check",
  "phone",
  "whatsapp",
  "linkedin",
  "github",
  "instagram",
  "shieldCheck",
  "brain",
  "gauge",
  "plugsConnected",
  "magnifyingGlass",
  "paperPlaneTilt",
  "microphone",
  "slidersHorizontal",
  "lockSimple",
  "arrowClockwise",
  "caretLeft",
  "caretRight",
  "sidebarSimple",
  "downloadSimple",
  "export",
  "plus",
  "copy",
  "shield",
  "name",
] as const;

/*
 * Everything under /work: Jomiez's own products and the builds made for
 * clients. Drag rows in the list to set the order they appear on the site.
 * A product also gets a full product page (the "Product page" tab).
 */
export const Projects: CollectionConfig = {
  slug: "projects",
  labels: { singular: "Product or project", plural: "Products & work" },
  orderable: true,
  admin: {
    group: "Content",
    useAsTitle: "name",
    defaultColumns: ["name", "category", "isProduct", "_status", "updatedAt"],
    description: "Our own products and the work we've built for clients. Drag to reorder.",
  },
  access: { read: publishedOrSignedIn, create: signedIn, update: signedIn, delete: signedIn },
  versions: { drafts: { autosave: { interval: 800 }, schedulePublish: false }, maxPerDoc: 50 },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Overview",
          fields: [
            {
              type: "row",
              fields: [
                { name: "name", label: "Name", type: "text", required: true, admin: { width: "50%" } },
                {
                  name: "category",
                  label: "Category",
                  type: "text",
                  required: true,
                  admin: { width: "50%", description: "e.g. AI Platform, E-commerce" },
                },
              ],
            },
            {
              name: "isProduct",
              label: "This is one of our own products",
              type: "checkbox",
              defaultValue: false,
              admin: { description: "Products get the full product page and appear under \"Our products\"." },
            },
            { name: "summary", label: "Summary", type: "textarea", required: true },
            image("image", "Screenshot", "Shown on cards and at the top of the case study."),
            {
              type: "row",
              fields: [
                { name: "client", label: "Client", type: "text", admin: { width: "50%" } },
                { name: "year", label: "Year", type: "text", admin: { width: "50%" } },
              ],
            },
            {
              name: "link",
              label: "Live site",
              type: "group",
              admin: { description: "Optional link to the live product." },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "label", label: "Text", type: "text", admin: { width: "50%" } },
                    { name: "href", label: "Web address", type: "text", admin: { width: "50%" } },
                  ],
                },
              ],
            },
            strings("services", "Services", "Service"),
            stats("stats", "Card stats"),
          ],
        },
        {
          label: "Case study",
          description: "The story told on the case study page (client builds).",
          fields: [
            {
              name: "sections",
              label: "Sections",
              type: "array",
              labels: { singular: "Section", plural: "Sections" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [
                { name: "title", label: "Heading", type: "text", required: true },
                { name: "body", label: "Text", type: "textarea" },
                {
                  name: "points",
                  label: "Points",
                  type: "array",
                  labels: { singular: "Point", plural: "Points" },
                  admin: { initCollapsed: true, components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
                  fields: [
                    { name: "title", label: "Point", type: "text", required: true },
                    { name: "body", label: "Detail", type: "textarea", required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "productPage",
          label: "Product page",
          description: "The full product page. Used when \"This is one of our own products\" is ticked.",
          admin: { condition: (data) => Boolean(data?.isProduct) },
          fields: [
            {
              name: "hero",
              label: "Hero",
              type: "group",
              fields: [
                { name: "title", label: "Headline", type: "text" },
                { name: "lead", label: "Introduction", type: "textarea" },
                link("cta", "Button"),
                image("image", "Background image"),
                { name: "proof", label: "Line beside the avatars", type: "textarea", admin: { rows: 2 } },
              ],
            },
            stats("stats", "Stat row", "text"),
            {
              name: "showcase",
              label: "Showcase",
              type: "group",
              fields: [
                { name: "title", label: "Heading", type: "text" },
                { name: "lead", label: "Text", type: "textarea" },
                image("background", "Background image"),
                image("screen", "Screenshot in the browser frame"),
                { name: "address", label: "Address bar text", type: "text" },
              ],
            },
            {
              name: "cards",
              label: "Feature cards",
              type: "array",
              maxRows: 4,
              labels: { singular: "Card", plural: "Cards" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [
                { name: "title", label: "Heading", type: "text", required: true },
                { name: "text", label: "Text", type: "textarea", required: true },
                {
                  type: "row",
                  fields: [
                    {
                      name: "mock",
                      label: "Window mockup",
                      type: "select",
                      defaultValue: "research",
                      options: [
                        { label: "Research task", value: "research" },
                        { label: "Chat prompt", value: "prompt" },
                      ],
                      admin: { width: "40%" },
                    },
                    { name: "mockTitle", label: "Text in the window", type: "text", admin: { width: "60%" } },
                  ],
                },
                image("art", "Card background"),
              ],
            },
            { name: "statement", label: "Big statement", type: "textarea" },
            {
              name: "system",
              label: "System notes",
              type: "group",
              fields: [
                { name: "label", label: "Label", type: "text" },
                { name: "text", label: "Text", type: "textarea" },
                {
                  name: "features",
                  label: "Notes",
                  type: "array",
                  labels: { singular: "Note", plural: "Notes" },
                  admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
                  fields: [
                    {
                      name: "icon",
                      label: "Icon",
                      type: "select",
                      required: true,
                      defaultValue: "shieldCheck",
                      options: FEATURE_ICONS.map((value) => ({ label: value, value })),
                    },
                    { name: "text", label: "Text", type: "textarea", required: true },
                  ],
                },
              ],
            },
            {
              name: "faq",
              label: "Questions",
              type: "group",
              fields: [
                { name: "sub", label: "Intro line", type: "textarea" },
                { name: "title", label: "Heading", type: "text" },
                faqItems(),
              ],
            },
          ],
        },
      ],
    },
    slugField("name", "/work/"),
  ],
  hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
};
