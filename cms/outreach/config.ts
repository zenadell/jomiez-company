import { randomBytes } from "node:crypto";
import type { CollectionConfig, GlobalConfig } from "payload";
import { adminsOnly, signedIn } from "../access";
import { secret, settleSecret } from "../agent/config";
import { COUNTRY_OPTIONS, KIND_OPTIONS } from "./kinds";

/*
 * Finding clients: businesses that could use a better website (leads), and the
 * settings for looking for them. Keeper finds them, checks their websites and
 * writes a message for each; the owner reads it and sends it (WhatsApp, a text
 * or an email), so nothing reaches a business without a person saying so.
 */

export const CLIENTS_GROUP = "Clients";

export const LEAD_STATUSES = [
  { value: "new", label: "Found" },
  { value: "checked", label: "Checked" },
  { value: "ready", label: "Message ready" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Not interested" },
  { value: "skipped", label: "Skipped" },
  { value: "stopped", label: "Asked not to be contacted" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

export const Leads: CollectionConfig = {
  slug: "leads",
  labels: { singular: "Lead", plural: "Leads" },
  admin: {
    group: CLIENTS_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "kind", "area", "score", "status", "updatedAt"],
    listSearchableFields: ["name", "area", "phone", "email", "website"],
    description: "Businesses that could use a better website. Keeper finds and checks them; you send the messages (from the phone app, or here).",
  },
  defaultSort: "-score",
  access: { read: signedIn, create: signedIn, update: signedIn, delete: signedIn },
  timestamps: true,
  fields: [
    { name: "name", label: "Business", type: "text", required: true },
    {
      type: "row",
      fields: [
        { name: "kind", label: "What it is", type: "text", admin: { width: "34%", description: "e.g. hair salon" } },
        { name: "area", label: "Area", type: "text", admin: { width: "33%" } },
        { name: "country", type: "select", options: COUNTRY_OPTIONS, defaultValue: "NG", admin: { width: "33%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "phone", type: "text", admin: { width: "34%", description: "International form, e.g. +2348031234567" } },
        { name: "email", type: "text", admin: { width: "33%" } },
        { name: "website", type: "text", admin: { width: "33%" } },
      ],
    },
    { name: "address", type: "text" },
    { name: "socials", label: "Social pages", type: "text", admin: { description: "Instagram, Facebook… (space-separated)" } },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [...LEAD_STATUSES],
      index: true,
      admin: { position: "sidebar" },
    },
    { name: "score", label: "Lead score", type: "number", min: 0, max: 100, index: true, admin: { position: "sidebar", description: "0–100: how much a new site would help and how easy they are to reach." } },
    { name: "summary", label: "What it found", type: "textarea", admin: { rows: 5, description: "From the website check: what's wrong, in plain words." } },
    { name: "review", label: "How their site looks", type: "textarea", admin: { rows: 3, description: "Keeper's notes from a phone-sized screenshot of their site." } },
    {
      name: "messages",
      label: "Message",
      type: "group",
      admin: { description: "Written by Keeper from what it found. Edit anything before sending." },
      fields: [
        { name: "whatsapp", label: "WhatsApp", type: "textarea", admin: { rows: 5 } },
        { name: "sms", label: "Text message", type: "textarea", admin: { rows: 3 } },
        { name: "emailSubject", label: "Email subject", type: "text" },
        { name: "emailBody", label: "Email", type: "textarea", admin: { rows: 8 } },
        { name: "followUp", label: "This is a follow-up", type: "checkbox", admin: { readOnly: true } },
        { name: "writtenAt", type: "date", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
      ],
    },
    {
      name: "preview",
      label: "Homepage preview",
      type: "group",
      admin: { description: "A free sample homepage made for them, at jomiez.com/preview/…" },
      fields: [
        { name: "slug", type: "text", unique: true, index: true, admin: { readOnly: true } },
        {
          name: "kind",
          label: "Made from",
          type: "select",
          defaultValue: "built-in",
          options: [
            { value: "built-in", label: "Our own design" },
            { value: "aethron", label: "A template (Aethron)" },
          ],
          admin: { readOnly: true },
        },
        { name: "content", type: "json", admin: { hidden: true } },
        // A preview made from a template: which one, its pages, the browser check and where its files are (cms/sites).
        { name: "site", type: "json", admin: { hidden: true } },
        { name: "madeAt", type: "date", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
        { name: "views", type: "number", defaultValue: 0, admin: { readOnly: true, description: "Times someone (not a link-preview robot) opened it." } },
        { name: "lastViewedAt", type: "date", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
      ],
    },
    {
      name: "log",
      label: "History",
      type: "array",
      admin: { readOnly: true, initCollapsed: true },
      fields: [
        { name: "at", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
        { name: "what", type: "text" },
      ],
    },
    { name: "contactedAt", label: "Contacted", type: "date", admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    { name: "followUps", type: "number", defaultValue: 0, admin: { position: "sidebar", readOnly: true } },
    { name: "notes", label: "Your notes", type: "textarea", admin: { position: "sidebar" } },
    { name: "source", type: "select", defaultValue: "manual", options: ["openstreetmap", "manual", "keeper"].map((v) => ({ value: v, label: v === "openstreetmap" ? "OpenStreetMap" : v === "manual" ? "Added by hand" : "Found by Keeper" })), admin: { position: "sidebar", readOnly: true } },
    { name: "sourceId", type: "text", index: true, admin: { hidden: true } },
    // Their website's address without "www." (for not adding the same business twice).
    { name: "domain", type: "text", index: true, admin: { hidden: true } },
    // The website check in full, and a small phone-sized screenshot of their site (both for Keeper and the app).
    { name: "check", type: "json", admin: { hidden: true } },
    { name: "shot", type: "textarea", maxLength: 200_000, admin: { hidden: true } },
    // The secret in their "don't contact me again" link.
    { name: "stopToken", type: "text", index: true, admin: { hidden: true } },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data.stopToken && !originalDoc?.stopToken) data.stopToken = randomBytes(18).toString("base64url");
        return data;
      },
    ],
    // However it's marked (the app, Keeper, or this admin), "asked not to be contacted" is remembered for good.
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (doc.status === "stopped" && previousDoc?.status !== "stopped") {
          const { suppress } = await import("./find");
          await suppress(req.payload, [doc.phone, doc.email, doc.domain]);
        }
        return doc;
      },
    ],
  },
};

export const OUTREACH_SECRETS = ["gmailPassword", "gmailScriptSecret", "pagespeedKey"] as const;

export const ClientSettings: GlobalConfig = {
  slug: "outreach",
  label: "Finding clients",
  admin: {
    group: CLIENTS_GROUP,
    description:
      "Where Keeper looks for businesses that need a website, what you offer them, and how messages are sent. Nothing is sent without you: every message waits for you in the phone app.",
  },
  access: { read: signedIn, update: adminsOnly },
  fields: [
    {
      name: "enabled",
      label: "Look for new clients every day",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Each morning Keeper finds new businesses in the areas below, checks their websites and writes messages for the best ones. You get a notification when they're ready." },
    },
    {
      name: "searches",
      label: "Where to look",
      type: "array",
      labels: { singular: "Area", plural: "Areas" },
      defaultValue: [
        { area: "Lekki Phase I, Lagos", country: "NG", kinds: ["food", "beauty", "health", "education", "stay"], on: true },
        { area: "Ikeja, Lagos", country: "NG", kinds: ["food", "beauty", "health", "professional", "shops"], on: true },
        { area: "Wuse, Abuja", country: "NG", kinds: ["food", "beauty", "health", "property", "stay"], on: true },
        { area: "London", country: "GB", kinds: ["food", "beauty", "trades", "professional"], on: true },
        { area: "Houston, Texas", country: "US", kinds: ["food", "beauty", "trades", "auto"], on: true },
      ],
      admin: { description: "A neighbourhood or town with its city (e.g. “Lekki Phase I, Lagos”, “Wuse, Abuja”, “Peckham, London”), not a whole county. Areas take turns, a few businesses at a time." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "area", type: "text", required: true, admin: { width: "45%" } },
            { name: "country", type: "select", required: true, defaultValue: "NG", options: COUNTRY_OPTIONS, admin: { width: "30%" } },
            { name: "on", label: "On", type: "checkbox", defaultValue: true, admin: { width: "25%" } },
          ],
        },
        { name: "kinds", label: "Kinds of business", type: "select", hasMany: true, required: true, options: KIND_OPTIONS },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "dailyNew", label: "New businesses a day", type: "number", defaultValue: 15, min: 1, max: 60, admin: { width: "50%", description: "Found and checked each morning." } },
        { name: "dailyReady", label: "Messages a day", type: "number", defaultValue: 10, min: 1, max: 40, admin: { width: "50%", description: "Written for the best of them, for you to send." } },
      ],
    },
    {
      name: "offer",
      label: "What you offer",
      type: "textarea",
      defaultValue: "A fast, modern website that looks great on phones, shows up on Google and turns visitors into calls and WhatsApp messages. Designed and built by Jomiez, usually ready in about a week.",
      admin: { rows: 4, description: "In your words, with a starting price if you like. Keeper only promises what's written here." },
    },
    {
      type: "row",
      fields: [
        { name: "senderName", label: "Your name", type: "text", admin: { width: "34%", description: "How messages are signed." } },
        { name: "senderPhone", label: "Your WhatsApp number", type: "text", admin: { width: "33%", description: "For the “Get this website” button on previews." } },
        { name: "address", label: "Business address", type: "text", admin: { width: "33%", description: "Put at the end of emails (required by law in the UK and US)." } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "previews", label: "Make homepage previews", type: "checkbox", defaultValue: true, admin: { width: "50%", description: "A free sample homepage for the most promising businesses, linked in the message." } },
        { name: "previewScore", label: "…for leads scoring at least", type: "number", defaultValue: 55, min: 0, max: 100, admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "followUp", label: "One follow-up if there's no reply", type: "checkbox", defaultValue: true, admin: { width: "50%" } },
        { name: "followUpDays", label: "…after this many days", type: "number", defaultValue: 4, min: 2, max: 21, admin: { width: "50%" } },
      ],
    },
    {
      type: "collapsible",
      label: "Email (your Gmail)",
      admin: {
        initCollapsed: true,
        description:
          "Emails go from your own Gmail, not the site's address (Resend, which sends the site's emails, doesn't allow messages people didn't ask for). On Render's free plan, use the Google Script: the plan blocks the ports a Gmail password needs.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "gmail", label: "Gmail address", type: "email", admin: { width: "50%" } },
            { name: "dailyEmails", label: "Emails a day, at most", type: "number", defaultValue: 20, min: 1, max: 50, admin: { width: "50%", description: "Keep it low: a new Gmail sending many emails to strangers gets flagged." } },
          ],
        },
        { name: "gmailScriptHelp", type: "ui", admin: { components: { Field: "/cms/admin/GmailScript#GmailScript" } } },
        {
          name: "gmailScriptUrl",
          label: "Google Script web app URL",
          type: "text",
          admin: { description: "https://script.google.com/macros/s/…/exec" },
          validate: (v: unknown) => (!v || /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(v).trim()) ? true : "Paste the Web app URL from Deploy (it starts https://script.google.com/macros/s/ and ends /exec)."),
        },
        ...secret("gmailScriptSecret", "Script password", "The password you set in the script. Stored encrypted."),
        ...secret("gmailPassword", "Or: Gmail app password", "Only on hosts that allow email ports (not Render's free plan): myaccount.google.com/apppasswords, with 2-Step Verification on."),
      ],
    },
    {
      type: "collapsible",
      label: "Website checks (Google PageSpeed)",
      admin: {
        initCollapsed: true,
        description:
          "With a free key Keeper also measures speed, phone layout and Google readiness, and gets a screenshot of each site. Make one at developers.google.com/speed/docs/insights/v5/get-started (Get a Key). Without it, Keeper does a simpler check of its own.",
      },
      fields: [...secret("pagespeedKey", "PageSpeed API key", "Free: 25,000 checks a day. Or set PAGESPEED_API_KEY in the environment.")],
    },
    {
      name: "weeklyPost",
      label: "Write a journal post every week",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Every Monday Keeper drafts a post on something business owners search for, so people find you on Google. It waits for you to publish it." },
    },
    // The routines these settings keep in step (Agent → Routines).
    { name: "findRoutine", type: "relationship", relationTo: "agent-routines", admin: { hidden: true } },
    { name: "postRoutine", type: "relationship", relationTo: "agent-routines", admin: { hidden: true } },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const next = { ...data } as Record<string, unknown>;
        const stored = (await req.payload.db.findGlobal({ slug: "outreach", req })) as Record<string, unknown> | null;
        for (const name of OUTREACH_SECRETS) settleSecret(next, name, stored);
        return next;
      },
    ],
    afterChange: [
      async ({ doc, req, context }) => {
        if (context.syncingRoutines) return doc;
        const { syncRoutines } = await import("./today");
        await syncRoutines(req.payload, doc as Record<string, unknown>, req.user?.id ?? null, req);
        return doc;
      },
    ],
  },
};
