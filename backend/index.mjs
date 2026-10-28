import { configuration } from './config.mjs';
import { connectDatabase } from './db.mjs';
import { createApp } from './app.mjs';

const config = configuration();
if (config.requireEmailVerification && (!config.smtpUrl || !config.mailFrom)) throw new Error('Email verification requires SMTP_URL and MAIL_FROM.');
let connection;
try { connection = await connectDatabase(config); }
catch (error) {
  console.error('MongoDB startup failed. Check backend/.env, the Atlas database user, network access and replica-set availability.');
  if (!config.uri || config.uri.includes('<') || error.message?.startsWith('Unimall requires')) console.error(error.message);
  process.exit(1);
}
const server = createApp({ ...connection, config }).listen(config.port, () => {
  const envName = process.env.NODE_ENV || 'development';
  const apiBase = `http://localhost:${config.port}`;
  const border = '='.repeat(61);

  if (!config.production) {
    console.log('[Development] Admin credentials are stored in backend/.env.\n');
  }
  console.log(border);
  console.log('  UNIMALL STORE - BACKEND ENGINE');
  console.log(border);
  console.log(`  ⚡ Environment : ${envName}`);
  console.log(`  🚀 API Server  : ${apiBase}`);
  console.log(`  🩺 Health Check: ${apiBase}/api/health`);
  console.log(`  🌐 Client CORS : ${config.origin}`);
  console.log(border);
  console.log('');
});
const shutdown = () => server.close(async () => { await connection.client.close(); process.exit(0); });
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
