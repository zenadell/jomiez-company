import type { CollectionConfig } from "payload";
import { adminsOnly, adminsOnlyField, adminsOrSelf, hasRole } from "../access";

/*
 * The people who run the site. Admins control everything, including who else
 * gets in; editors change content but can't manage accounts. Five wrong
 * passwords lock an account for ten minutes.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Team member", plural: "Team" },
  admin: {
    group: "Settings",
    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles", "updatedAt"],
    description: "Everyone who can sign in to this admin.",
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 60 * 60 * 8,
    cookies: { sameSite: "Lax" },
  },
  access: {
    // The very first account can always be created (Payload's own first-user screen).
    create: adminsOnly,
    read: adminsOrSelf,
    update: adminsOrSelf,
    delete: adminsOnly,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "roles",
      label: "Role",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["editor"],
      saveToJWT: true,
      options: [
        { label: "Admin: everything, including the team", value: "admin" },
        { label: "Editor: all content", value: "editor" },
      ],
      access: { update: adminsOnlyField, create: adminsOnlyField },
      admin: { description: "Admins manage the team and site settings; editors manage content." },
    },
  ],
  hooks: {
    beforeChange: [
      // The first account ever made is an admin, so nobody gets locked out.
      async ({ data, req, operation }) => {
        if (operation !== "create") return data;
        const { totalDocs } = await req.payload.count({ collection: "users", overrideAccess: true });
        if (totalDocs === 0) return { ...data, roles: ["admin"] };
        if (!hasRole(req.user, "admin")) return { ...data, roles: ["editor"] };
        return data;
      },
    ],
  },
};
