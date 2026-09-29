import { PAGE_PICKER, enabled, faqItems, image, link, marquee, paragraph, strings, text, ticker } from "../fields";
import { pageGlobal } from "./page";

/*
 * The home page, one tab per section, top to bottom in the order they appear.
 * The tenets, services, seasons and questions here are also used on the About,
 * Services, Work and Contact pages.
 */
export const HomePage = pageGlobal({
  slug: "home",
  label: "Home page",
  description: "Every section of the home page, in order. The switch at the top of each tab shows or hides it.",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "hero",
          label: "Hero",
          fields: [
            enabled(),
            {
              type: "row",
              fields: [
                {
                  name: "titleMuted",
                  label: "Headline, grey part",
                  type: "text",
                  required: true,
                  admin: { width: "50%" },
                },
                {
                  name: "titleMain",
                  label: "Headline, dark part",
                  type: "text",
                  required: true,
                  admin: { width: "50%" },
                },
              ],
            },
            paragraph("lead", "Introduction", undefined, true),
            link("cta", "Button"),
            image("background", "Background image", "The wide photo behind the hero."),
            {
              name: "card",
              label: "Floating card",
              type: "group",
              fields: [
                enabled("Show the floating card"),
                {
                  type: "row",
                  fields: [
                    { name: "title", label: "Title", type: "text", admin: { width: "33%" } },
                    { name: "subtitle", label: "Subtitle", type: "text", admin: { width: "33%" } },
                    { name: "href", label: "Goes to", type: "text", admin: { width: "34%", components: { afterInput: [PAGE_PICKER] } } },
                  ],
                },
                image("image", "Screenshot"),
                image("frame", "Frame texture", "The coloured frame around the screenshot."),
              ],
            },
            paragraph("note", "Line above the tools strip"),
            {
              name: "showStack",
              label: "Show the scrolling tools strip (the tools are set in Site settings)",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          name: "intro",
          label: "Introduction",
          fields: [
            enabled(),
            paragraph("statement", "Big statement", "Fills in word by word as visitors scroll.", true),
            paragraph("sub", "Line under it"),
            {
              name: "projects",
              label: "Dark card",
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "value", label: "Figure", type: "text", admin: { width: "30%" } },
                    { name: "text", label: "Text", type: "textarea", admin: { width: "70%" } },
                  ],
                },
              ],
            },
            {
              name: "satisfaction",
              label: "Avatars card",
              type: "group",
              admin: { description: "The avatars are set in Site settings." },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "value", label: "Figure", type: "text", admin: { width: "30%" } },
                    { name: "label", label: "Text", type: "text", admin: { width: "70%" } },
                  ],
                },
              ],
            },
            {
              name: "years",
              label: "Small card",
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "value", label: "Figure", type: "text", admin: { width: "30%" } },
                    { name: "text", label: "Text", type: "text", admin: { width: "70%" } },
                  ],
                },
              ],
            },
            {
              name: "speed",
              label: "Dial card",
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "title", label: "Heading", type: "text", admin: { width: "40%" } },
                    { name: "text", label: "Text", type: "text", admin: { width: "60%" } },
                  ],
                },
              ],
            },
            {
              name: "quote",
              label: "Quote card",
              type: "group",
              fields: [
                { name: "text", label: "Quote", type: "textarea" },
                {
                  type: "row",
                  fields: [
                    { name: "brand", label: "Name beside the logo", type: "text", admin: { width: "40%" } },
                    { name: "by", label: "Signed", type: "text", admin: { width: "60%" } },
                  ],
                },
              ],
            },
            ticker(),
          ],
        },
        {
          name: "work",
          label: "Creations",
          fields: [
            enabled(),
            marquee("Creations"),
            {
              name: "projects",
              label: "Show these (in this order)",
              type: "relationship",
              relationTo: "projects",
              hasMany: true,
              admin: { description: "Leave empty to show the first six from Products & work." },
            },
          ],
        },
        {
          name: "services",
          label: "Services",
          description: "Also shown on the Services page.",
          fields: [
            enabled(),
            text("label", "Label", undefined, true),
            paragraph("intro", "Introduction"),
            text("title", "Heading", undefined, true),
            link("cta", "Button"),
            {
              name: "items",
              label: "Services (hover to open)",
              type: "array",
              minRows: 1,
              labels: { singular: "Service", plural: "Services" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [
                { name: "title", label: "Title", type: "text", required: true },
                { name: "body", label: "Text", type: "textarea", required: true },
              ],
            },
            {
              type: "row",
              fields: [
                { ...image("texture", "Card texture"), admin: { width: "50%" } },
                { ...image("iso", "Card illustration"), admin: { width: "50%" } },
              ],
            },
          ],
        },
        {
          name: "mission",
          label: "Philosophy",
          fields: [
            enabled(),
            text("label", "Label", undefined, true),
            paragraph("statement", "Big statement", "Fills in word by word as visitors scroll.", true),
            paragraph("body", "Text under it"),
            paragraph("modelsIntro", "Line beside the AI models"),
            link("cta", "Button"),
            {
              name: "features",
              label: "Four promises (each with its own animated icon)",
              type: "array",
              minRows: 4,
              maxRows: 4,
              labels: { singular: "Promise", plural: "Promises" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [{ name: "text", label: "Text", type: "textarea", required: true }],
            },
          ],
        },
        {
          name: "tenets",
          label: "Tenets",
          description: "Also shown on the About page.",
          fields: [
            enabled(),
            marquee("Our Tenets"),
            paragraph("description", "Line under the title"),
            text("cardFooter", "Small line on each card", 'e.g. "A Jomiez tenet"'),
            {
              name: "items",
              label: "Tenets",
              type: "array",
              minRows: 3,
              labels: { singular: "Tenet", plural: "Tenets" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "title", label: "Name", type: "text", required: true, admin: { width: "60%" } },
                    { name: "tag", label: "Tag", type: "text", required: true, admin: { width: "40%" } },
                  ],
                },
                { name: "body", label: "Text", type: "textarea", required: true },
              ],
            },
            ticker(),
          ],
        },
        {
          name: "showcase",
          label: "Image band",
          fields: [
            enabled(),
            image("image", "Image", undefined),
            paragraph("lead", "Top line"),
            text("pill", "Small tag", 'e.g. "7+ years of craft"'),
            text("title", "Big title", undefined, true),
          ],
        },
        {
          name: "process",
          label: "Four seasons",
          description: "Also shown on the Services page.",
          fields: [
            enabled(),
            text("label", "Label", undefined, true),
            text("title", "Heading", undefined, true),
            {
              type: "row",
              fields: [
                { ...image("texture", "Texture"), admin: { width: "50%" } },
                { ...image("iso", "Illustration"), admin: { width: "50%" } },
              ],
            },
            {
              name: "steps",
              label: "Steps",
              type: "array",
              minRows: 1,
              labels: { singular: "Step", plural: "Steps" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "title", label: "Title", type: "text", required: true, admin: { width: "70%" } },
                    { name: "tag", label: "Tag", type: "text", required: true, admin: { width: "30%" } },
                  ],
                },
                { name: "body", label: "Text", type: "textarea", required: true },
              ],
            },
            paragraph("closing", "Closing line"),
            link("cta", "Button"),
          ],
        },
        {
          name: "studio",
          label: "Company",
          fields: [
            enabled(),
            paragraph("statement", "Big statement", undefined, true),
            paragraph("intro", "Introduction"),
            link("cta", "Button"),
            text("exploreLabel", "Link text on each card", 'e.g. "Explore →"'),
            {
              name: "disciplines",
              label: "Disciplines",
              type: "array",
              minRows: 1,
              labels: { singular: "Discipline", plural: "Disciplines" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "name", label: "Name", type: "text", required: true, admin: { width: "50%" } },
                    { name: "role", label: "Subtitle", type: "text", required: true, admin: { width: "50%" } },
                  ],
                },
                { name: "body", label: "Text", type: "textarea", required: true },
                {
                  type: "row",
                  fields: [
                    { ...image("image", "Image"), admin: { width: "50%" } },
                    {
                      name: "href",
                      label: "Goes to",
                      type: "text",
                      required: true,
                      admin: { width: "50%", components: { afterInput: [PAGE_PICKER] } },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "pricing",
          label: "Pricing",
          fields: [
            enabled(),
            marquee("Pricing"),
            paragraph("intro", "Introduction"),
            {
              name: "billing",
              label: "Billing switch",
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "left", label: "Left option", type: "text", admin: { width: "33%" } },
                    { name: "right", label: "Right option", type: "text", admin: { width: "33%" } },
                    { name: "hint", label: "Hint after it", type: "text", admin: { width: "34%" } },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    { name: "leftNote", label: "Note when left is on", type: "text", admin: { width: "50%" } },
                    { name: "rightNote", label: "Note when right is on", type: "text", admin: { width: "50%" } },
                  ],
                },
              ],
            },
            image("cardImage", "Card texture"),
            {
              name: "tiers",
              label: "Plans",
              type: "array",
              minRows: 1,
              labels: { singular: "Plan", plural: "Plans" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "name", label: "Name", type: "text", required: true, admin: { width: "40%" } },
                    {
                      name: "price",
                      label: "Price",
                      type: "text",
                      required: true,
                      defaultValue: "Custom",
                      admin: { width: "30%" },
                    },
                    {
                      name: "dark",
                      label: "Highlight (dark card)",
                      type: "checkbox",
                      admin: { width: "30%", style: { alignSelf: "flex-end" } },
                    },
                  ],
                },
                { name: "blurb", label: "Description", type: "textarea", required: true },
                strings("features", "Includes", "Item"),
                link("cta", "Button"),
              ],
            },
            ticker(),
          ],
        },
        {
          name: "faq",
          label: "Questions",
          description: "Also shown at the bottom of the About, Services, Work and Contact pages.",
          fields: [
            enabled(),
            text("label", "Label", undefined, true),
            paragraph("sub", "Intro line"),
            text("title", "Heading", undefined, true),
            link("cta", "Button"),
            faqItems(),
          ],
        },
        {
          name: "journal",
          label: "Journal",
          fields: [
            enabled(),
            marquee("Journal"),
            paragraph("intro", "Introduction"),
            link("cta", "Button"),
            {
              name: "count",
              label: "How many posts to show",
              type: "number",
              defaultValue: 3,
              min: 1,
              max: 12,
              required: true,
            },
          ],
        },
      ],
    },
  ],
});
