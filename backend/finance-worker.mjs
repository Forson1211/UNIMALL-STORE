import { configuration } from './config.mjs';
import { connectDatabase } from './db.mjs';
import { Paystack } from './paystack.mjs';
import { runFinance } from './finance.mjs';

const config = configuration(), connection = await connectDatabase(config);
const ctx = { ...connection, config, provider: new Paystack(config) };
let stopping = false;
process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });
try {
  do {
    try { console.log(JSON.stringify({ source: 'finance-worker', at: new Date().toISOString(), result: await runFinance(ctx) })); }
    catch (error) { console.error(JSON.stringify({ source: 'finance-worker', status: 'failed', code: error.code || 'WORKER_ERROR' })); }
    if (process.argv.includes('--once')) break;
    for (let n = 0; n < 60 && !stopping; n++) await new Promise(resolve => setTimeout(resolve, 1000));
  } while (!stopping);
} finally { await connection.client.close(); }
