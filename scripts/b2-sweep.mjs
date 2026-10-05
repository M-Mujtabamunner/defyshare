// Permanently deletes every B2 upload older than 3 hours.
// Run by .github/workflows/b2-sweep.yml every 15 minutes; locally:
//   node --env-file=.env.local scripts/b2-sweep.mjs
import { b2Config, sweepExpired } from '../server/b2.js';

const cfg = b2Config();
if (!cfg.keyId || !cfg.appKey) {
  console.error('B2_KEY_ID and B2_APPLICATION_KEY must be set');
  process.exit(1);
}

const { scanned, deleted, errors } = await sweepExpired(cfg);
console.log(`scanned ${scanned}, deleted ${deleted}`);
for (const e of errors) console.error(e);
if (errors.length > 0) process.exit(1);
