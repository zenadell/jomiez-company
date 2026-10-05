/*
 * `npm run content:save` writes this admin's content to content-snapshot/ (commit it
 * and the next deploy to an empty database starts from it).
 * `npm run content:load -- --yes` loads content-snapshot/ into the database this
 * environment points at, replacing what's there with the same address.
 */
import type { SanitizedConfig } from "payload";
import { getPayload } from "payload";
import config from "../payload.config";
import { applySnapshot, hasSnapshot, saveSnapshot } from "./snapshot";

const mode = process.argv.includes("--load") ? "load" : "save";
const payload = await getPayload({ config: config as SanitizedConfig | Promise<SanitizedConfig> });

if (mode === "save") {
  const { file, summary } = await saveSnapshot(payload);
  payload.logger.info(`Saved ${summary} to ${file}.`);
  payload.logger.info("Next: git add content-snapshot && git commit -m \"Content snapshot\" && git push");
} else if (!hasSnapshot()) {
  payload.logger.error("There's no content-snapshot/ to load. Run npm run content:save first (in the admin you're copying from).");
} else if (!process.argv.includes("--yes")) {
  payload.logger.warn("This replaces pages, products, posts, redirects and settings in this database with the snapshot's. Run again with --yes to go ahead.");
} else {
  payload.logger.info(`Loaded ${await applySnapshot(payload)}.`);
}
process.exit(0);
