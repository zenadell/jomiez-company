/* "Mar 4, 2026", from a date or a full ISO timestamp, the same on server and client. */
export function formatDate(value: string) {
  const d = value.length <= 10 ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
