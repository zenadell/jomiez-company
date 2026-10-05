import type { TextField } from "payload";

export const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** The page address, made from the title when left empty. */
export function slugField(from: string, prefix: string): TextField {
  return {
    name: "slug",
    label: "Page address",
    type: "text",
    unique: true,
    index: true,
    admin: {
      position: "sidebar",
      description: `The last part of the link: ${prefix}<address>. Made from the ${from} if left empty.`,
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          const base = typeof value === "string" && value.trim() ? value : (data?.[from] as string | undefined);
          return base ? slugify(base) : value;
        },
      ],
    },
  };
}
