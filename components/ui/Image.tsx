"use client";

import NextImage, { type ImageLoader, type ImageProps } from "next/image";
import { readFrame } from "@/lib/media";

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
  // How the picture is framed (Media → "How it's framed on the site"), carried on its address.
  const { url, frame } = typeof props.src === "string" ? readFrame(props.src) : { url: props.src, frame: null };
  const fromCloudinary = typeof url === "string" && CLOUDINARY.test(url);
  const style = frame
    ? {
        ...props.style,
        objectFit: frame.fit,
        objectPosition: `${frame.x}% ${frame.y}%`,
        ...(frame.zoom !== 100 ? { transform: `scale(${frame.zoom / 100})`, transformOrigin: `${frame.x}% ${frame.y}%` } : {}),
      }
    : props.style;
  return <NextImage {...props} src={url} style={style} loader={fromCloudinary ? cloudinary : props.loader} />;
}
