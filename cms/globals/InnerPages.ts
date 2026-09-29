import type { ArrayField, GroupField } from "payload";
import { enabled, image, link, marquee, paragraph, text } from "../fields";
import { pageGlobal } from "./page";

/* The large opener at the top of the inner pages. */
const opener = (withEyebrow = false): GroupField => ({
  name: "hero",
  label: "Page opener",
  type: "group",
  fields: [
    ...(withEyebrow ? [text("eyebrow", "Small label above")] : []),
    text("title", "Headline", undefined, true),
    paragraph("lead", "Introduction"),
    link("cta", "Button"),
  ],
});

const showFaq = {
  name: "showFaq",
  label: "Show the questions at the bottom (set on the Home page)",
  type: "checkbox" as const,
  defaultValue: true,
};

const cards = (name: string, label: string, singular: string, extra: ArrayField["fields"] = []): ArrayField => ({
  name,
  label,
  type: "array",
  labels: { singular, plural: label },
  admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "body", label: "Text", type: "textarea", required: true },
    ...extra,
  ],
});

export const AboutPage = pageGlobal({
  slug: "about",
  label: "About page",
  description: "The company page at /about.",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Opener",
          fields: [
            opener(),
            {
              name: "mosaic",
              label: "Screens under the opener",
              type: "array",
              maxRows: 4,
              labels: { singular: "Screen", plural: "Screens" },
              fields: [image("image", "Image", undefined, true)],
            },
          ],
        },
        {
          name: "story",
          label: "Our story",
          fields: [
            enabled(),
            text("label", "Label", undefined, true),
            text("title", "Heading", undefined, true),
            link("cta", "Button"),
            {
              name: "paragraphs",
              label: "Story",
              type: "array",
              labels: { singular: "Paragraph", plural: "Paragraphs" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [{ name: "text", label: "Paragraph", type: "textarea", required: true }],
            },
            {
              name: "showStats",
              label: "Show the company stats (set in Site settings)",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          name: "crafts",
          label: "Our crafts",
          fields: [
            enabled(),
            text("label", "Label", undefined, true),
            paragraph("statement", "Big statement", undefined, true),
            paragraph("lead", "Text under it"),
            {
              name: "showStack",
              label: "Show the scrolling tools strip",
              type: "checkbox",
              defaultValue: true,
            },
            cards("cards", "Crafts", "Craft", [
              {
                name: "shape",
                label: "Symbol",
                type: "select",
                defaultValue: "blocks",
                options: [
                  { label: "Blocks", value: "blocks" },
                  { label: "Z-line", value: "zline" },
                  { label: "Rings", value: "rings" },
                  { label: "Diamond", value: "diamond" },
                ],
              },
            ]),
          ],
        },
        {
          label: "More",
          fields: [
            {
              name: "showTenets",
              label: "Show the tenets (set on the Home page)",
              type: "checkbox",
              defaultValue: true,
            },
            showFaq,
          ],
        },
      ],
    },
  ],
});

export const ServicesPage = pageGlobal({
  slug: "services-page",
  label: "Services page",
  description: "The services page at /services.",
  fields: [
    opener(true),
    {
      name: "showAccordion",
      label: "Show the services accordion (set on the Home page)",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "showProcess",
      label: "Show the four seasons (set on the Home page)",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "list",
      label: "Every craft",
      type: "group",
      fields: [enabled(), text("title", "Heading", undefined, true), cards("items", "Services", "Service")],
    },
    showFaq,
  ],
});

export const WorkPage = pageGlobal({
  slug: "work-page",
  label: "Products & work page",
  description: "The page at /work that lists every product and project.",
  fields: [
    image("image", "Opener image"),
    marquee("Creations"),
    {
      name: "note",
      label: "Line in the opener",
      type: "textarea",
      admin: { description: "{products} and {builds} are replaced by the live counts." },
    },
    {
      type: "row",
      fields: [
        { name: "productsLabel", label: "Label above our products", type: "text", admin: { width: "50%" } },
        { name: "clientsLabel", label: "Label above client work", type: "text", admin: { width: "50%" } },
      ],
    },
    {
      name: "caseStudy",
      label: "Case study pages",
      type: "group",
      admin: { description: "Words used on every case study page." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "productKicker", label: "Label on products", type: "text", admin: { width: "50%" } },
            { name: "caseKicker", label: "Label on client work", type: "text", admin: { width: "50%" } },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "nextProduct", label: "\"Next\" label (product)", type: "text", admin: { width: "50%" } },
            { name: "nextCase", label: "\"Next\" label (client work)", type: "text", admin: { width: "50%" } },
          ],
        },
        text("ctaTitle", "Closing heading"),
        link("cta", "Closing button"),
      ],
    },
    showFaq,
  ],
});

export const JournalPage = pageGlobal({
  slug: "journal-page",
  label: "Journal page",
  description: "The journal index at /insights and the words around each post.",
  fields: [
    marquee("Journal"),
    paragraph("intro", "Introduction"),
    {
      name: "post",
      label: "Post pages",
      type: "group",
      fields: [
        {
          type: "row",
          fields: [
            { name: "authorLabel", label: "\"Author\" label", type: "text", admin: { width: "33%" } },
            { name: "dateLabel", label: "\"Published\" label", type: "text", admin: { width: "33%" } },
            { name: "byLabel", label: "\"Written by\" on cards", type: "text", admin: { width: "34%" } },
          ],
        },
        text("moreTitle", "Heading above more posts"),
        link("cta", "Button beside it"),
      ],
    },
  ],
});

export const ContactPage = pageGlobal({
  slug: "contact-page",
  label: "Contact page",
  description: "The contact page at /contact, including the form's wording.",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "split",
          label: "Form",
          fields: [
            text("title", "Headline", undefined, true),
            paragraph("lead", "Introduction"),
            image("image", "Image beside the form"),
            text("visualTitle", "Line on the image"),
            {
              name: "form",
              label: "Form wording",
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "nameLabel", label: "Name label", type: "text", admin: { width: "50%" } },
                    { name: "namePlaceholder", label: "Name example", type: "text", admin: { width: "50%" } },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    { name: "emailLabel", label: "Email label", type: "text", admin: { width: "50%" } },
                    { name: "emailPlaceholder", label: "Email example", type: "text", admin: { width: "50%" } },
                  ],
                },
                { name: "budgetLabel", label: "Budget label", type: "text" },
                {
                  name: "budgets",
                  label: "Budget options",
                  type: "array",
                  labels: { singular: "Option", plural: "Options" },
                  admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
                  fields: [{ name: "text", label: "Option", type: "text", required: true }],
                },
                {
                  type: "row",
                  fields: [
                    { name: "messageLabel", label: "Message label", type: "text", admin: { width: "50%" } },
                    { name: "messagePlaceholder", label: "Message example", type: "text", admin: { width: "50%" } },
                  ],
                },
                { name: "submitLabel", label: "Send button", type: "text" },
                { name: "successMessage", label: "Thank-you message", type: "textarea" },
                { name: "errorMessage", label: "Something-went-wrong message", type: "textarea" },
              ],
            },
          ],
        },
        {
          name: "call",
          label: "Book a call",
          fields: [
            enabled(),
            image("image", "Photo"),
            text("label", "Label", undefined, true),
            paragraph("title", "Big statement", undefined, true),
            paragraph("body", "Text"),
            { name: "showSocials", label: "Show the social icons", type: "checkbox", defaultValue: true },
            link("cta", "Button"),
          ],
        },
        { label: "More", fields: [showFaq] },
      ],
    },
  ],
});

const legalFields = [
  text("title", "Title", undefined, true),
  paragraph("intro", "Introduction", undefined, true),
  {
    name: "sections",
    label: "Sections",
    type: "array" as const,
    labels: { singular: "Section", plural: "Sections" },
    admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
    fields: [
      text("title", "Heading", undefined, true),
      paragraph("body", "Text"),
      paragraph("intro", "Line before the list"),
      {
        name: "items",
        label: "List",
        type: "array" as const,
        labels: { singular: "Item", plural: "Items" },
        admin: { initCollapsed: true },
        fields: [{ name: "text", label: "Item", type: "text" as const, required: true }],
      },
    ],
  },
  {
    name: "contactNote",
    label: "Closing contact section",
    type: "checkbox" as const,
    defaultValue: true,
    admin: { description: "Adds a last section with the company email and phone." },
  },
];

export const PrivacyPage = pageGlobal({
  slug: "privacy",
  label: "Privacy policy",
  group: "Legal",
  description: "The page at /privacy-policy.",
  fields: legalFields,
});

export const TermsPage = pageGlobal({
  slug: "terms",
  label: "Terms & conditions",
  group: "Legal",
  description: "The page at /terms-conditions.",
  fields: legalFields,
});

export const NotFoundPage = pageGlobal({
  slug: "not-found",
  label: "Page not found (404)",
  group: "Settings",
  description: "What visitors see when a link is broken.",
  fields: [text("title", "Headline", undefined, true), paragraph("body", "Text"), link("cta", "Button")],
});
