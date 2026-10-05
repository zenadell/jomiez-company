"use client";

import NextImage, { type ImageLoader, type ImageProps } from "next/image";

/*
 * next/image, except that pictures stored on Cloudinary (everything uploaded
 * through the admin, in production) are resized by Cloudinary's CDN: the width
 * each screen needs, as AVIF, WebP or JPEG for the browser, never enlarged.
 * Resizing them on this server instead costs seconds of CPU and hundreds of MB
 * of memory per page, more than a small Render plan has. Anything else (files
 * in public/, uploads kept on this computer) still goes through Next.js.
 */

/** "…/image/upload/v1/jomiez-site/chaka-ai.jpg": the addresses cms/storage/cloudinary.ts makes. */
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/[^?]+)(\?.*)?$/;

const cloudinary: ImageLoader = ({ src, width, quality }) =>
  src.replace(CLOUDINARY, (_, base: string, file: string) => `${base}f_auto,c_limit,w_${width},q_${quality ?? "auto"}/${file}`);

export default function Image(props: ImageProps) {
  const fromCloudinary = typeof props.src === "string" && CLOUDINARY.test(props.src);
  return <NextImage {...props} loader={fromCloudinary ? cloudinary : props.loader} />;
}
