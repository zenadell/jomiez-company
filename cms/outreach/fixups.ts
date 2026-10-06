import type { Payload, PayloadRequest } from "payload";

/*
 * One-off repairs to leads made before the website check learned to tell a
 * site that's down from one that turns automated visitors away (a security
 * shield answering 403, or no answer in time). Those leads were told their
 * site was broken when it wasn't: their messages are cleared and they're
 * checked again on the next run. Run by the 2026-10-06 migrations.
 */
export async function recheckTurnedAway(payload: Payload, req?: PayloadRequest) {
  const { docs } = await payload.find({
    collection: "leads",
    where: {
      and: [
        { status: { in: ["ready", "checked", "skipped"] } },
        { or: ["error page (401)", "error page (403)", "error page (406)", "error page (429)", "error page (503)", "couldn't be opened, so anyone"].map((text) => ({ summary: { like: text } })) },
      ],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
    req,
  });
  for (const lead of docs as unknown as { id: number; log?: unknown[] }[]) {
    await payload.update({
      collection: "leads",
      id: lead.id,
      data: {
        status: "new",
        summary: null,
        review: null,
        score: null,
        messages: { whatsapp: null, sms: null, emailSubject: null, emailBody: null, followUp: false, writtenAt: null },
        log: [...(lead.log ?? []), { at: new Date().toISOString(), what: "Checking again: the first check was turned away by the site's security, so its “broken site” message was wrong and has been removed" }],
      } as never,
      overrideAccess: true,
      req,
    });
  }

  // The first default area, "Lekki, Lagos", matches a huge rural county: the neighbourhood is meant.
  const g = (await payload.findGlobal({ slug: "outreach", depth: 0, overrideAccess: true, req })) as unknown as { searches?: { area?: string }[] };
  if (g.searches?.some((s) => s.area?.trim() === "Lekki, Lagos")) {
    await payload.updateGlobal({
      slug: "outreach",
      data: { searches: g.searches.map((s) => (s.area?.trim() === "Lekki, Lagos" ? { ...s, area: "Lekki Phase I, Lagos" } : s)) } as never,
      overrideAccess: true,
      context: { syncingRoutines: true },
      req,
    });
  }
  return docs.length;
}
