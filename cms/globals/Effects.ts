import type { GlobalConfig } from "payload";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks";

/*
 * The site's motion and liquid-glass effects. Glass effects only ever run on
 * browsers with a GPU (and the live-bending ones only in Chrome, Edge, Brave
 * and Arc); these switches turn them off for everyone.
 */
export const Effects: GlobalConfig = {
  slug: "effects",
  label: "Effects",
  admin: {
    group: "Settings",
    description: "Switch the liquid glass and motion effects on or off across the whole site.",
  },
  access: { read: signedIn, update: signedIn, readVersions: signedIn },
  versions: { max: 30 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: "collapsible",
      label: "Liquid glass",
      fields: [
        {
          name: "cursorLens",
          label: "Cursor lens: a glass drop that follows the mouse and magnifies the page",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "lensSize",
          label: "Cursor lens size (px)",
          type: "number",
          defaultValue: 132,
          min: 80,
          max: 240,
          admin: { condition: (d) => Boolean(d?.cursorLens) },
        },
        { name: "navGlass", label: "Glass nav bar", type: "checkbox", defaultValue: true },
        { name: "footerGlass", label: "Glass letters in the footer wordmark", type: "checkbox", defaultValue: true },
        {
          name: "heroDew",
          label: "Hero dewdrop (for browsers without the cursor lens)",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Motion",
      fields: [
        { name: "pageTransitions", label: "Page transition (slide up)", type: "checkbox", defaultValue: true },
        { name: "smoothScroll", label: "Smooth scrolling", type: "checkbox", defaultValue: true },
      ],
    },
  ],
};
