import type { Access, FieldAccess } from "payload";

/*
 * Who may do what. The public site never goes through these: it reads with the
 * Local API on the server. These rules guard the admin and the REST API, so
 * drafts, the inbox and the user list stay behind a login.
 */

type Roled = { roles?: ("admin" | "editor")[] | null } | null | undefined;

export const hasRole = (user: unknown, role: "admin" | "editor") =>
  Boolean((user as Roled)?.roles?.includes(role));

/** Anyone signed in to the admin. */
export const signedIn: Access = ({ req: { user } }) => Boolean(user);

/** Admins only (users, roles, destructive settings). */
export const adminsOnly: Access = ({ req: { user } }) => hasRole(user, "admin");

export const adminsOnlyField: FieldAccess = ({ req: { user } }) => hasRole(user, "admin");

/** Admins, or the signed-in user acting on their own account. */
export const adminsOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (hasRole(user, "admin")) return true;
  return { id: { equals: user.id } };
};

/** Published documents for everyone; drafts only when signed in. */
export const publishedOrSignedIn: Access = ({ req: { user } }) => {
  if (user) return true;
  return { _status: { equals: "published" } };
};

export const anyone: Access = () => true;
