import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { configuration } from './config.mjs';

const config = configuration();
if (!config.uri) { console.error('Configure MONGODB_URI before running vendor acceptance checks.'); process.exitCode = 1; }
else {
  const child = spawn(process.execPath, ['--test', fileURLToPath(new URL('./tests/vendor-flow.test.mjs', import.meta.url))], {
    stdio: 'inherit', env: { ...process.env, TEST_MONGODB_URI: config.uri,
      RUN_VENDOR_BROWSER: process.argv.some(value => ['--browser', '--browser-only'].includes(value)) ? 'true' : 'false',
      VENDOR_BROWSER_ONLY: process.argv.includes('--browser-only') ? 'true' : 'false' },
  });
  child.on('error', () => { console.error('Could not start vendor acceptance checks.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
