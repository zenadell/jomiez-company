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
  ],
  hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
};
