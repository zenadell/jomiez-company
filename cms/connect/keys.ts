import { createHmac, randomBytes } from "node:crypto";
import type { CollectionConfig } from "payload";
import { adminsOnly } from "../access";
import { AGENT_GROUP } from "../agent/config";

/*
 * Access keys: how another agent (Claude Code, ChatGPT, a script of your own)
 * sees what Keeper is doing and gives it work, through the agent API
 * (/api/v1/…) or its MCP server (/api/mcp).
 *
 * A key is shown once, when it's made, and only its fingerprint (an HMAC of
 * it, keyed by PAYLOAD_SECRET) is stored, so the database alone can't be used
 * to recover or forge one. Each key acts as the admin who made it, limited to
 * the permissions ticked on it; it can expire, be tied to addresses, and be
 * revoked at any moment.
 */

export const SCOPES = [
  { value: "read", label: "See", hint: "conversations, what Keeper did, leads, settings (never keys or passwords)" },
  { value: "chat", label: "Talk", hint: "give Keeper tasks and continue conversations (its approval rules still apply)" },
  { value: "approve", label: "Approve", hint: "answer Keeper's approval requests (only for agents you fully trust)" },
  { value: "control", label: "Control", hint: "stop or undo work, switch the model, turn Keeper or routines on and off" },
] as const;

export type Scope = (typeof SCOPES)[number]["value"];

const pepper = () => createHmac("sha256", process.env.PAYLOAD_SECRET || "local-development-secret-change-me").update("jomiez-access-keys").digest();

/** A key's stored fingerprint. */
export const fingerprint = (token: string) => createHmac("sha256", pepper()).update(token).digest("hex");

/** A new key: "jz_" and 43 random characters (256 bits). */
export function newToken() {
  const token = `jz_${randomBytes(32).toString("base64url")}`;
  return { token, prefix: token.slice(0, 10), hash: fingerprint(token) };
}

export const AccessKeys: CollectionConfig = {
  slug: "access-keys",
  labels: { singular: "Access key", plural: "Access keys" },
  admin: {
    group: AGENT_GROUP,
    useAsTitle: "name",
    defaultColumns: ["name", "prefix", "scopes", "lastUsedAt", "expiresAt", "revoked"],
    description:
      "Keys that let another agent (Claude Code, ChatGPT, your own scripts) see what Keeper is doing and give it work. Each key is shown once, when it's made. Revoke one the moment you stop trusting where it is.",
    components: { beforeList: ["/cms/admin/connect/NewAccessKey#NewAccessKey"] },
  },
  // Made only through /api/connect/new, which shows the key once.
  access: { read: adminsOnly, create: () => false, update: adminsOnly, delete: adminsOnly },
  timestamps: true,
  fields: [
    { name: "name", label: "Who it's for", type: "text", required: true, admin: { description: "e.g. “Claude Code on my laptop”" } },
    {
      name: "scopes",
      label: "What it may do",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["read"],
      options: SCOPES.map((s) => ({ value: s.value, label: s.label })),
      admin: { description: SCOPES.map((s) => `${s.label}: ${s.hint}.`).join(" ") },
    },
    {
      type: "row",
      fields: [
        {
          name: "expiresAt",
          label: "Stops working on",
          type: "date",
          admin: { width: "50%", date: { pickerAppearance: "dayOnly" }, description: "Empty: never." },
        },
        { name: "revoked", label: "Revoked", type: "checkbox", defaultValue: false, admin: { width: "50%", description: "Stops it at once." } },
      ],
    },
    {
      name: "allowedIps",
      label: "Only from these addresses",
      type: "textarea",
      admin: { description: "Optional. One IP address per line (as this site's host sees it). Empty: from anywhere." },
      validate: (v: unknown) => {
        const bad = String(v ?? "")
          .split(/[\s,]+/)
          .filter(Boolean)
          .find((ip) => !/^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]+$/i.test(ip));
        return bad ? `“${bad}” isn't an IP address.` : true;
      },
    },
    { name: "activity", type: "ui", admin: { components: { Field: "/cms/admin/connect/KeyActivity#KeyActivity" } } },
    { name: "prefix", label: "Starts with", type: "text", admin: { readOnly: true, position: "sidebar" }, access: { update: () => false } },
    { name: "owner", label: "Acts as", type: "relationship", relationTo: "users", admin: { readOnly: true, position: "sidebar" }, access: { update: () => false } },
    { name: "lastUsedAt", label: "Last used", type: "date", admin: { readOnly: true, position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
    { name: "lastUsedIp", label: "Last used from", type: "text", admin: { readOnly: true, position: "sidebar" } },
    // Never readable through the admin or the REST API; the server reads it with overrideAccess.
    { name: "hash", type: "text", index: true, unique: true, admin: { hidden: true }, access: { read: () => false, update: () => false } },
  ],
};
