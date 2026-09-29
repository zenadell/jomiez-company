import type { ArrayField } from "payload";
import { image, link } from "../fields";
import { pageGlobal } from "./page";

const links = (name: string, label: string): ArrayField => ({
  name,
  label,
  type: "array",
  labels: { singular: "Link", plural: "Links" },
  admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
  fields: [
    {
      type: "row",
      fields: [
        { name: "label", label: "Text", type: "text", required: true, admin: { width: "40%" } },
        { name: "href", label: "Goes to", type: "text", required: true, admin: { width: "60%" } },
      ],
    },
  ],
});

/* The glass nav bar at the top and the footer at the bottom of every page. */
export const Navigation = pageGlobal({
  slug: "navigation",
  label: "Nav & footer",
  group: "Settings",
  description: "The links in the top bar and the footer, shown on every page.",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "header",
          label: "Top bar",
          fields: [
            links("links", "Links"),
            { name: "showHire", label: "Show the button on the right", type: "checkbox", defaultValue: true },
            link("hire", "Button on the right"),
          ],
        },
        {
          name: "footer",
          label: "Footer",
          fields: [
            image("background", "Background image", "The scene behind the footer."),
            {
              name: "blurb",
              label: "Line under the logo",
              type: "textarea",
              admin: { description: "{legalName} is replaced by the full company name." },
            },
            link("cta", "Button beside the email"),
            { name: "followLabel", label: "Label above the social icons", type: "text" },
            {
              name: "columns",
              label: "Link columns",
              type: "array",
              maxRows: 4,
              labels: { singular: "Column", plural: "Columns" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [{ name: "title", label: "Heading", type: "text", required: true }, links("links", "Links")],
            },
            {
              name: "copyright",
              label: "Copyright line",
              type: "text",
              admin: { description: "{year} and {legalName} are filled in automatically." },
            },
            {
              name: "showWordmark",
              label: "Show the giant glass wordmark",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
      ],
    },
  ],
});
