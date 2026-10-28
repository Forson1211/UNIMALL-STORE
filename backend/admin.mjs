import { configuration } from './config.mjs';
import { connectDatabase, transact } from './db.mjs';
import { emailAddress, fail, timestamp } from './security.mjs';

// Run locally with database administration access; never expose this as an API.
const email = emailAddress(process.argv[2]);
const { db, client } = await connectDatabase(configuration());
try {
  await transact(client, async session => {
    await db.collection('revisions').updateOne({ _id: 'role_changes' }, { $inc: { version: 1 } }, { upsert: true, session });
    if (await db.collection('users').countDocuments({ role: 'admin', disabled: { $ne: true } }, { session })) fail(409, 'An administrator already exists. Use the staff dashboard to assign further roles.');
    const user = await db.collection('users').findOne({ email, disabled: { $ne: true } }, { session });
    if (!user) fail(404, 'Register this account through the application first.');
    await db.collection('users').updateOne({ id: user.id }, { $set: { role: 'admin', vendor_status: null } }, { session });
    await db.collection('sessions').deleteMany({ user_id: user.id }, { session });
    await db.collection('system_logs').insertOne({ id: crypto.randomUUID(), user_id: user.id, type: 'security', source: 'bootstrap', message: 'Initial administrator assigned locally', created_at: timestamp() }, { session });
  });
  console.log('Initial administrator assigned. Sign in again to load the new role.');
} catch (error) {
  console.error(error.status ? error.message : 'Administrator setup failed. Check the database connection.');
  process.exitCode = 1;
} finally { await client.close(); }
