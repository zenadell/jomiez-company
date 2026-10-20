import type { CollectionConfig } from "payload";
import { anyone, signedIn } from "../access";
import { revalidateAfterDelete, revalidateCollection } from "../hooks";

/*
 * Every picture on the site. Files are stored on disk in development and in
 * Vercel Blob in production (see payload.config.ts); the site's <Image> does the
 * resizing, so only an admin thumbnail is generated here.
 */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Image", plural: "Media library" },
  admin: {
    group: "Content",
    description: "All images used on the site. Replace a file here and it changes everywhere it's used.",
    defaultColumns: ["filename", "alt", "updatedAt"],
  },
  access: { read: anyone, create: signedIn, update: signedIn, delete: signedIn },
  upload: {
    staticDir: "uploads",
    mimeTypes: ["image/*"],
    adminThumbnail: "thumbnail",
    focalPoint: false,
    imageSizes: [{ name: "thumbnail", width: 480, height: 320, position: "centre" }],
  },
  fields: [
    {
      name: "alt",
      label: "Description (alt text)",
      type: "text",
      admin: { description: "What the image shows, for screen readers and search engines. Leave empty for decoration." },
    },
    {
      type: "collapsible",
      label: "How it's framed on the site",
      admin: {
        initCollapsed: true,
        description: "Wherever this picture appears: show all of it, or fill the space and choose which part stays in view, and zoom. Keeper can set this when you say “it's too big” or “show the whole picture”.",
      },
      fields: [
        {
          name: "frame",
          type: "group",
          label: false,
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "fit",
                  label: "Fit",
                  type: "select",
                  defaultValue: "cover",
                  options: [
                    { label: "Fill the space (the edges may be cropped)", value: "cover" },
                    { label: "Show the whole picture", value: "contain" },
                  ],
                  admin: { width: "50%" },
                },
                { name: "zoom", label: "Zoom (%)", type: "number", defaultValue: 100, min: 50, max: 300, admin: { width: "50%", description: "Under 100 shows it smaller; over 100 closer." } },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "x", label: "Keep in view: across (%)", type: "number", defaultValue: 50, min: 0, max: 100, admin: { width: "50%", description: "0 = the left edge, 100 = the right." } },
                { name: "y", label: "…and down (%)", type: "number", defaultValue: 50, min: 0, max: 100, admin: { width: "50%", description: "0 = the top, 100 = the bottom." } },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
};
