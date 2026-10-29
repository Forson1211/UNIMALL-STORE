import { MongoClient } from 'mongodb';
import { configureMongoDns } from './mongo-dns.mjs';

export const COLLECTIONS = ['users', 'profiles', 'sessions', 'auth_tokens', 'products', 'orders', 'order_items',
  'transactions', 'payout_requests', 'vendor_payment_methods', 'reviews', 'wishlists', 'coupons', 'deals',
  'notifications', 'messages', 'support_tickets', 'system_logs', 'campus_news', 'site_settings', 'site_pages',
  'navigation_menus', 'media_library', 'uploads', 'revisions', 'vendor_delivery_contacts', 'vendor_follows'];

export async function initializeDatabase(db) {
  for (const name of COLLECTIONS) {
    await db.collection(name).createIndex({ id: 1 }, { unique: true, sparse: true });
  }
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('profiles').createIndex({ user_id: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ token_hash: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
  await db.collection('auth_tokens').createIndex({ token_hash: 1 }, { unique: true });
  await db.collection('auth_tokens').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
  await db.collection('orders').createIndex({ buyer_id: 1, checkout_request_id: 1 }, { unique: true });
  await db.collection('order_items').createIndex({ order_id: 1, vendor_id: 1 });
  await db.collection('products').createIndex({ vendor_id: 1, is_active: 1, created_at: -1 });
  await db.collection('wishlists').createIndex({ user_id: 1, product_id: 1 }, { unique: true });
  await db.collection('reviews').createIndex({ user_id: 1, product_id: 1 }, { unique: true });
  await db.collection('reviews').createIndex({ product_id: 1, status: 1 });
  await db.collection('site_settings').createIndex({ setting_key: 1 }, { unique: true });
  await db.collection('site_pages').createIndex({ slug: 1 }, { unique: true });
  await db.collection('coupons').createIndex({ code: 1 }, { unique: true });
  await db.collection('notifications').createIndex({ user_id: 1, created_at: -1 });
  await db.collection('uploads').createIndex({ bucket: 1, path: 1 }, { unique: true });
  await db.collection('payout_requests').createIndex({ vendor_id: 1, status: 1 });
  await db.collection('vendor_delivery_contacts').createIndex({ vendor_id: 1, created_at: -1 });
  await db.collection('vendor_follows').createIndex({ user_id: 1, vendor_id: 1 }, { unique: true });
  await db.collection('vendor_follows').createIndex({ vendor_id: 1 });
  const timestamp = new Date().toISOString();
  for (const [key, value] of Object.entries({ site_name: 'Unimall', site_tagline: 'Your Campus Marketplace', allow_vendor_registration: true })) {
    await db.collection('site_settings').updateOne({ setting_key: key }, { $setOnInsert: { id: crypto.randomUUID(), setting_key: key, setting_value: value, setting_category: 'general', created_at: timestamp, updated_at: timestamp } }, { upsert: true });
  }
}

let cached = null;

export async function connectDatabase(config) {
  if (cached) return cached;
  if (!/^mongodb(?:\+srv)?:\/\//.test(config.uri) || config.uri.includes('<')) {
    throw new Error('Set a real MONGODB_URI in backend/.env. Copy backend/.env.example to start.');
  }
  await configureMongoDns(config);
  const client = new MongoClient(config.uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 20, appName: 'Unimall' });
  try {
    await client.connect();
    const hello = await client.db('admin').command({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid') throw new Error('Unimall requires a MongoDB replica set for checkout transactions. Use Atlas or the supplied local replica-set configuration.');
    const db = client.db(config.database);
    await initializeDatabase(db);
    cached = { client, db };
    return cached;
  } catch (error) {
    await client.close().catch(() => {});
    throw error;
  }
}

export async function transact(client, work) {
  const session = client.startSession();
  try { return await session.withTransaction(() => work(session), { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } }); }
  finally { await session.endSession(); }
}
