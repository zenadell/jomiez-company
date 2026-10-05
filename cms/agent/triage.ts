import type { Payload } from "payload";
import { missingSetup } from "./providers";
import { loadConfig, runAgent } from "./run";

/*
 * Each new contact-form message is read by the agent in a sealed-off mode: the
 * message is a stranger's words, so the agent may only read it and set that one
 * message's status and notes. No other documents, no memory, no email, no web.
 * It never replies on its own; the owner is told what it found (notify.ts).
 */
export async function triageInquiry(payload: Payload, inquiryId: number | string, origin: string) {
  const cfg = await loadConfig(payload);
  if (!cfg.enabled || !cfg.triage) return;
  if (missingSetup({ provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL })) return;
  const inquiry = await payload.findByID({ collection: "inquiries", id: Number(inquiryId), depth: 0, overrideAccess: true }).catch(() => null);
  if (!inquiry) return;
  await runAgent({
    payload,
    user: null,
    scope: "triage",
    source: "inbox",
    inquiryId,
    label: `a message from ${inquiry.name || inquiry.email}`,
    message: `A new contact-form message has arrived: inquiries id ${inquiryId}. Read it and triage it.`,
    origin,
  });
}
