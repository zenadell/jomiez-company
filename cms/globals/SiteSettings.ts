import { adminsOnly, signedIn } from "../access";
import { image, stats, strings } from "../fields";
import { revalidateGlobal } from "../hooks";
import type { GlobalConfig } from "payload";

export const SOCIAL_ICONS = ["whatsapp", "linkedin", "github", "instagram"] as const;

/*
 * Who the company is and how to reach it: used across every page (nav, footer,
 * contact details, founder credits, search defaults) and by the contact form.
 */
export const SiteSettings: GlobalConfig = {
  slug: "site",
  label: "Site settings",
  admin: {
    group: "Settings",
    description: "Company details, contact info, socials, search defaults and where contact messages go.",
  },
  access: { read: signedIn, update: adminsOnly, readVersions: signedIn },
  versions: { max: 30 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Company",
          fields: [
            {
              type: "row",
              fields: [
                { name: "name", label: "Short name", type: "text", required: true, admin: { width: "50%" } },
                { name: "legalName", label: "Full company name", type: "text", required: true, admin: { width: "50%" } },
              ],
            },
            {
              name: "url",
              label: "Website address",
              type: "text",
              required: true,
              admin: { description: "The live address, used for search engines and sharing (https://jomiez.com)." },
            },
            {
              name: "founder",
              label: "Founder",
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "name", label: "Full name", type: "text", admin: { width: "40%" } },
                    { name: "alias", label: "Known as", type: "text", admin: { width: "25%" } },
                    { name: "role", label: "Role", type: "text", admin: { width: "35%" } },
                  ],
                },
                image("photo", "Portrait", "Shown in the Philosophy section. Leave empty to show the monogram."),
                {
                  name: "monogram",
                  label: "Monogram",
                  type: "text",
                  maxLength: 2,
                  admin: { description: "The letter shown when there is no portrait." },
                },
              ],
            },
            stats("stats", "Company stats"),
            {
              name: "avatars",
              label: "Client avatars",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              maxRows: 6,
              admin: { description: "The small round faces on the home page and product pages." },
            },
            strings("stack", "Tools we build with", "Tool", "Shown in the scrolling strips. Known names get their logo."),
          ],
        },
        {
          label: "Contact",
          fields: [
            {
              type: "row",
              fields: [
                { name: "email", label: "Email", type: "email", required: true, admin: { width: "50%" } },
                { name: "location", label: "Location", type: "text", admin: { width: "50%" } },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "phone", label: "Phone (as shown)", type: "text", admin: { width: "50%" } },
                {
                  name: "phoneHref",
                  label: "Phone (for dialling)",
                  type: "text",
                  admin: { width: "50%", description: "e.g. tel:+14252637569" },
                },
              ],
            },
            {
              name: "socials",
              label: "Social links",
              type: "array",
              labels: { singular: "Link", plural: "Links" },
              admin: { components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "label", label: "Name", type: "text", required: true, admin: { width: "25%" } },
                    {
                      name: "icon",
                      label: "Icon",
                      type: "select",
                      required: true,
                      options: SOCIAL_ICONS.map((value) => ({ label: value, value })),
                      admin: { width: "25%" },
                    },
                    { name: "href", label: "Web address", type: "text", required: true, admin: { width: "50%" } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Announcement",
          fields: [
            {
              name: "ticker",
              label: "Announcement ticker",
              type: "group",
              admin: { description: "The thin scrolling strip between sections." },
              fields: [
                { name: "enabled", label: "Show the ticker", type: "checkbox", defaultValue: true },
                { name: "tag", label: "Tag", type: "text", admin: { description: 'e.g. "//JOMIEZ"' } },
                { name: "message", label: "Message", type: "textarea" },
              ],
            },
          ],
        },
        {
          label: "Search & sharing",
          fields: [
            { name: "title", label: "Default page title", type: "text", required: true },
            {
              name: "titleTemplate",
              label: "Title pattern for other pages",
              type: "text",
              required: true,
              defaultValue: "%s | Jomiez",
              admin: { description: "%s is replaced by the page's own title." },
            },
            { name: "description", label: "Default description", type: "textarea", required: true },
            image("ogImage", "Default sharing image", "1200 × 630."),
          ],
        },
        {
          label: "Messages",
          description: "What happens when someone sends the contact form.",
          fields: [
            {
              name: "notifications",
              label: "Contact form",
              type: "group",
              fields: [
                {
                  name: "to",
                  label: "Send new messages to",
                  type: "email",
                  admin: { description: "Leave empty to use the company email. Needs email set up (see ADMIN.md)." },
                },
                { name: "autoReply", label: "Send the visitor an automatic reply", type: "checkbox", defaultValue: true },
                {
                  name: "autoReplySubject",
                  label: "Automatic reply subject",
                  type: "text",
                  admin: { condition: (_, s) => Boolean(s?.autoReply) },
                },
                {
                  name: "autoReplyBody",
                  label: "Automatic reply text",
                  type: "textarea",
                  admin: {
                    condition: (_, s) => Boolean(s?.autoReply),
                    description: "{name} is replaced by the visitor's name.",
                    rows: 6,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
