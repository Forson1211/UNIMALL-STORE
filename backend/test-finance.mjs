import { spawnSync } from 'node:child_process';
// The test itself uses only a random, isolated database and a fake payment provider.
const result = spawnSync(process.execPath, ['--test', 'backend/tests/finance-mongodb.test.mjs'], { stdio: 'inherit', env: { ...process.env, RUN_FINANCE_DB_TESTS: 'true' } });
process.exitCode = result.status ?? 1;
