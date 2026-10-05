import { cloudStoragePlugin } from "@payloadcms/plugin-cloud-storage";
import type { Adapter } from "@payloadcms/plugin-cloud-storage/types";
import { v2 as cloudinary } from "cloudinary";
import type { Plugin } from "payload";

/*
 * Images in Cloudinary, when CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and
 * CLOUDINARY_API_SECRET are set (the same names the old portfolio uses).
 * Files go to the "jomiez-site" folder, each size as its own file, and the
 * site links straight to Cloudinary's CDN. Without the keys, images stay in
 * the local uploads/ folder (or Vercel Blob, when that's set up instead).
 */

const FOLDER = process.env.CLOUDINARY_FOLDER || "jomiez-site";

export const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
);

/** "card-1-480x320.jpg" → public id "jomiez-site/card-1-480x320", format "jpg". */
function parts(filename: string) {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  const format = dot > 0 ? filename.slice(dot + 1).toLowerCase() : undefined;
  return { publicId: `${FOLDER}/${base}`, format };
}

function resourceType(mime: string | undefined) {
  if (mime?.startsWith("image/")) return "image" as const;
  if (mime?.startsWith("video/")) return "video" as const;
  return "raw" as const;
}

const url = (filename: string, mime?: string) => {
  const { publicId, format } = parts(filename);
  const type = resourceType(mime ?? (format && /^(jpe?g|png|webp|gif|avif|svg)$/.test(format) ? "image/x" : undefined));
  // Raw files keep their extension inside the public id.
  return type === "raw"
    ? cloudinary.url(`${publicId}.${format}`, { secure: true, resource_type: "raw" })
    : cloudinary.url(publicId, { secure: true, resource_type: type, format });
};

const adapter: Adapter = () => ({
  name: "cloudinary",
  handleUpload: async ({ file }) => {
    const { publicId, format } = parts(file.filename);
    const type = resourceType(file.mimeType);
    await new Promise<void>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: type === "raw" ? `${publicId}.${format}` : publicId,
          resource_type: type,
          overwrite: true,
          invalidate: true,
          use_filename: false,
          unique_filename: false,
        },
        (err) => (err ? reject(err) : resolve()),
      );
      stream.end(file.buffer);
    });
  },
  handleDelete: async ({ filename, doc }) => {
    const { publicId, format } = parts(filename);
    const type = resourceType((doc as { mimeType?: string }).mimeType);
    await cloudinary.uploader.destroy(type === "raw" ? `${publicId}.${format}` : publicId, { resource_type: type, invalidate: true });
  },
  generateURL: ({ filename, data }) => url(filename, (data as { mimeType?: string } | undefined)?.mimeType),
  // Only used when Payload serves the file itself; with the CDN links above it rarely is.
  staticHandler: async (_req, { params }) => {
    const res = await fetch(url(params.filename));
    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" },
    });
  },
});

export function cloudinaryStorage(): Plugin {
  if (cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
      analytics: false,
    });
  }
  return cloudStoragePlugin({
    enabled: cloudinaryConfigured,
    // The plugin's own fields (the file's folder and key) exist with or without
    // Cloudinary, so the database is the same here and in production.
    alwaysInsertFields: true,
    collections: { media: { adapter: cloudinaryConfigured ? adapter : null, disableLocalStorage: true, disablePayloadAccessControl: true } },
  });
}
