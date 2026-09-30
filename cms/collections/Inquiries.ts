import type { CollectionConfig } from "payload";
import { signedIn } from "../access";

/*
 * The inbox: every message sent through the contact form. Nothing can be
 * created through the API; messages only arrive through the site's own form
 * (app/(site)/contact/actions.ts), which filters spam first.
 */
export const Inquiries: CollectionConfig = {
  slug: "inquiries",
  labels: { singular: "Message", plural: "Inbox" },
  admin: {
    group: "Inbox",
    useAsTitle: "name",
    defaultColumns: ["name", "email", "budget", "status", "createdAt"],
    listSearchableFields: ["name", "email", "company", "message"],
    description: "Messages from the contact form. Change the status as you work through them.",
  },
  defaultSort: "-createdAt",
  access: { read: signedIn, create: () => false, update: signedIn, delete: signedIn },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, admin: { width: "50%", readOnly: true } },
        { name: "email", label: "Email", type: "email", required: true, admin: { width: "50%", readOnly: true } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "company", label: "Company", type: "text", admin: { width: "50%", readOnly: true } },
        { name: "budget", label: "Budget", type: "text", admin: { width: "50%", readOnly: true } },
      ],
    },
    { name: "message", label: "Message", type: "textarea", required: true, admin: { readOnly: true, rows: 8 } },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { label: "New", value: "new" },
        { label: "In progress", value: "in-progress" },
        { label: "Replied", value: "replied" },
        { label: "Archived", value: "archived" },
        { label: "Spam", value: "spam" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "notes",
      label: "Team notes",
      type: "textarea",
      admin: { position: "sidebar", description: "Only visible here." },
    },
    {
      name: "source",
      label: "Details",
      type: "group",
      admin: { position: "sidebar", readOnly: true },
      fields: [
        { name: "page", label: "Sent from", type: "text", admin: { readOnly: true } },
        { name: "userAgent", label: "Browser", type: "text", admin: { readOnly: true } },
      ],
    },
  ],
};
