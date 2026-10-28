import { MongoClient } from 'mongodb';
import { configuration } from './config.mjs';
import { configureMongoDns } from './mongo-dns.mjs';

const config = configuration();
let client;
try {
  if (!/^mongodb(?:\+srv)?:\/\//.test(config.uri) || config.uri.includes('<')) {
    console.error('Set a complete MONGODB_URI in backend/.env.');
    process.exitCode = 1;
  } else {
    await configureMongoDns(config);
    client = new MongoClient(config.uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, socketTimeoutMS: 10000, maxPoolSize: 2, appName: 'UnimallSetupCheck' });
    await client.connect();
    const db = client.db(config.database);
    await db.command({ ping: 1 });
    const hello = await client.db('admin').command({ hello: 1 });
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const transactionsSupported = !!hello.setName || hello.msg === 'isdbgrid';
    console.log(JSON.stringify({ connected: true, database: config.database, transactionsSupported, existingCollections: collections.length }));
    if (!transactionsSupported) process.exitCode = 1;
  }
} catch (error) {
  const servers = [...(error.reason?.servers?.values?.() || [])];
  const codes = [...new Set([error.code, error.cause?.code, ...servers.flatMap(server => [server.error?.code, server.error?.cause?.code])].filter(Boolean))];
  console.error(JSON.stringify({ connected: false, errorType: error.name, codes }));
  console.error('Check the Atlas database user, connection string and IP access list. Credentials are not printed.');
  process.exitCode = 1;
} finally { if (client) await client.close(); }
