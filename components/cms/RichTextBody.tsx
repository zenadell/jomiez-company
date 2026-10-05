import { RichText, type JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import Image from "@/components/ui/Image";
import { img } from "@/lib/media";
import type { Media } from "@/payload-types";

/*
 * Rich text written in the admin, rendered with the site's own styles: the
 * caller's class for quotes and lists, <Image> for uploaded pictures, and
 * internal links resolved to their pages.
 */
export function RichTextBody({
  data,
  className,
  quoteClassName,
  listClassName,
}: {
  /** A rich text field's value. */
  data: unknown;
  className?: string;
  quoteClassName?: string;
  listClassName?: string;
}) {
  if (!data) return null;

  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    quote: ({ node, nodesToJSX }) => <blockquote className={quoteClassName}>{nodesToJSX({ nodes: node.children })}</blockquote>,
    list: ({ node, nodesToJSX }) => {
      const Tag = node.tag === "ol" ? "ol" : "ul";
      return <Tag className={listClassName}>{nodesToJSX({ nodes: node.children })}</Tag>;
    },
    upload: ({ node }) => {
      const image = img(node.value as Media);
      if (!image) return null;
      return (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width ?? 1200}
          height={image.height ?? 800}
          sizes="(max-width: 809px) 100vw, 760px"
          style={{ width: "100%", height: "auto", borderRadius: 18 }}
        />
      );
    },
    link: ({ node, nodesToJSX }) => {
      const f = node.fields as { url?: string; newTab?: boolean; linkType?: string; doc?: { relationTo?: string; value?: { slug?: string } } };
      let href = f.url ?? "#";
      if (f.linkType === "internal" && f.doc?.value?.slug) {
        const base = f.doc.relationTo === "projects" ? "/work/" : f.doc.relationTo === "articles" ? "/insights/" : "/";
        href = `${base}${f.doc.value.slug}`;
      }
      return (
        <a href={href} target={f.newTab ? "_blank" : undefined} rel={f.newTab ? "noopener" : undefined}>
          {nodesToJSX({ nodes: node.children })}
        </a>
      );
    },
  });

  return (
    <RichText
      data={data as SerializedEditorState}
      converters={converters}
      className={className}
      disableContainer={!className}
    />
  );
}
