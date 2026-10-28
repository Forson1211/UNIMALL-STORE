import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { configuration } from './config.mjs';
import { COLLECTIONS, connectDatabase } from './db.mjs';
import { seedDatabase } from './seed-data.mjs';

let connection;
try {
  const config = configuration();
  connection = await connectDatabase(config);
  let credentialsFile;
  let credentialsSaved;
  const result = await seedDatabase(connection, {
    adminEmail: process.env.SEED_ADMIN_EMAIL, adminPassword: process.env.SEED_ADMIN_PASSWORD,
    saveCredentials(credentials) {
      credentialsSaved ||= (async () => {
        const directory = new URL('../.local/credentials/', import.meta.url);
        await mkdir(directory, { recursive: true });
        credentialsFile = new URL('initial-admin-' + randomUUID() + '.json', directory);
        await writeFile(credentialsFile, JSON.stringify({ ...credentials, loginUrl: config.origin + '/login', database: config.database }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      })();
      return credentialsSaved;
    },
  });
  console.log(JSON.stringify({ database: config.database, collections: COLLECTIONS.length, ...result }));
  if (result.administrator === 'created' && credentialsFile) console.log('Initial administrator credentials saved locally: ' + fileURLToPath(credentialsFile));
  console.log('Seed completed. Existing settings, content and passwords were preserved.');
} catch (error) {
  const code = String(error.code || error.cause?.code || '');
  const reason = error.status ? error.message
    : code === '18' ? 'Atlas authentication failed. Check the database user and URI-encoded password in backend/.env.'
    : /ENOTFOUND|ECONNREFUSED|ETIMEOUT|EAI_AGAIN/.test(code) ? 'Atlas network/DNS connection failed. Check the cluster address and IP access list.'
    : 'Database seed could not complete. Check MONGODB_URI in backend/.env, Atlas network access, and database permissions.';
  console.error(reason);
  console.error('No connection strings or passwords are included in this output.');
  process.exitCode = 1;
} finally { if (connection) await connection.client.close(); }
