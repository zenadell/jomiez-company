/*
 * `npm run seed` fills an empty database with the site's content;
 * `npm run seed:fresh` wipes the content first. `npm run cms:prepare` (run
 * before every production build) applies migrations, then seeds only if empty.
 */
import type { SanitizedConfig } from "payload";
import { getPayload } from "payload";
import config from "../../payload.config";
import { seed, seedIfEmpty } from "./index";

const fresh = process.argv.includes("--fresh");
const payload = await getPayload({ config: config as SanitizedConfig | Promise<SanitizedConfig> });

// Development applies migrations in onInit; production (NODE_ENV=production) runs
// them through prodMigrations as the connection opens. Either way they're done here.
if (fresh) await seed(payload, { fresh: true });
else if (!(await seedIfEmpty(payload))) payload.logger.info("Seed: the database already has content, nothing to do.");

process.exit(0);
