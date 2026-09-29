import type { ArrayField, CheckboxField, Field, GroupField, TextField, UploadField } from "payload";

/*
 * Building blocks shared by the collections and globals, so every link, image,
 * section toggle and list looks and behaves the same across the whole admin.
 */

/** The "Choose a page" list under every "Goes to" box (cms/admin/PagePicker.tsx). */
export const PAGE_PICKER = "/cms/admin/PagePicker#PagePicker";

/** A button or link: its words and where it goes. */
export function link(name: string, label: string, description?: string): GroupField {
  return {
    name,
    label,
    type: "group",
    admin: { description, hideGutter: true },
    fields: [
      {
        type: "row",
        fields: [
          { name: "label", label: "Text", type: "text", required: true, admin: { width: "50%" } },
          {
            name: "href",
            label: "Goes to",
            type: "text",
            required: true,
            admin: {
              width: "50%",
              description: "Choose a page, or type any address (/about, /#pricing, https://…).",
              components: { afterInput: [PAGE_PICKER] },
            },
          },
        ],
      },
    ],
  };
}

/** An image from the media library. */
export function image(name: string, label: string, description?: string, required = false): UploadField {
  return { name, label, type: "upload", relationTo: "media", required, admin: { description } };
}

/** The switch at the top of every section: off hides the section from the site. */
export function enabled(label = "Show this section"): CheckboxField {
  return { name: "enabled", label, type: "checkbox", defaultValue: true };
}

/** A plain one-line text field. */
export function text(name: string, label: string, description?: string, required = false): TextField {
  return { name, label, type: "text", required, admin: { description } };
}

/** A longer passage. */
export function paragraph(name: string, label: string, description?: string, required = false): Field {
  return { name, label, type: "textarea", required, admin: { description, rows: 3 } };
}

/** A figure and what it counts ("80+" / "Projects delivered"). */
export function stats(name = "stats", label = "Stats", labelField = "label"): ArrayField {
  return {
    name,
    label,
    type: "array",
    labels: { singular: "Stat", plural: "Stats" },
    admin: { initCollapsed: true, components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
    fields: [
      {
        type: "row",
        fields: [
          { name: "value", label: "Figure", type: "text", required: true, admin: { width: "30%" } },
          labelField === "text"
            ? { name: "text", label: "Description", type: "textarea", required: true, admin: { width: "70%" } }
            : { name: labelField, label: "What it counts", type: "text", required: true, admin: { width: "70%" } },
        ],
      },
    ],
  };
}

/** Questions and answers. */
export function faqItems(name = "items", label = "Questions"): ArrayField {
  return {
    name,
    label,
    type: "array",
    labels: { singular: "Question", plural: "Questions" },
    admin: { initCollapsed: true, components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
    fields: [
      { name: "q", label: "Question", type: "text", required: true },
      { name: "a", label: "Answer", type: "textarea", required: true },
    ],
  };
}

/** A list of short strings (features, services, technologies). */
export function strings(name: string, label: string, singular: string, description?: string): ArrayField {
  return {
    name,
    label,
    type: "array",
    labels: { singular, plural: label },
    admin: { description, initCollapsed: true, components: { RowLabel: "/cms/admin/RowLabel#RowLabel" } },
    fields: [{ name: "text", label: singular, type: "text", required: true }],
  };
}

/** The giant scrolling title some sections open with. */
export function marquee(defaultHint: string): TextField {
  return {
    name: "marquee",
    label: "Giant scrolling title",
    type: "text",
    required: true,
    admin: { description: `The huge word that scrolls across the section (e.g. "${defaultHint}").` },
  };
}

/** Whether the thin announcement ticker runs under a section. */
export function ticker(): CheckboxField {
  return {
    name: "showTicker",
    label: "Show the announcement ticker under this section",
    type: "checkbox",
    defaultValue: true,
  };
}
