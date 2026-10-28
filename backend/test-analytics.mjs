import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { configuration } from './config.mjs';

const config = configuration();
if (!config.uri) { console.error('Configure MONGODB_URI before running analytics acceptance checks.'); process.exitCode = 1; }
else {
  const child = spawn(process.execPath, ['--test', fileURLToPath(new URL('./tests/analytics.test.mjs', import.meta.url))], {
    stdio: 'inherit', env: { ...process.env, TEST_MONGODB_URI: config.uri },
  });
  child.on('error', () => { console.error('Could not start analytics acceptance checks.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
