import { randomBytes, randomUUID } from 'node:crypto';
import { transact } from './db.mjs';
import { emailAddress, fail, hashPassword, timestamp } from './security.mjs';
import { DEFAULT_MENUS, DEFAULT_PAGES, DEFAULT_SETTINGS } from './seed-defaults.mjs';

export async function seedDatabase({ db, client }, options = {}) {
  const adminEmail = options.adminEmail ? emailAddress(options.adminEmail) : null;
  const password = options.adminPassword || randomBytes(24).toString('base64url');
  let preparedHash;
  return transact(client, async session => {
    // Shared with both administrator setup and dashboard role changes.
    await db.collection('revisions').updateOne({ _id: 'role_changes' }, { $inc: { version: 1 } }, { session, upsert: true });
    let administrator = 'preserved';
    let adminId;
    if (!await db.collection('users').findOne({ role: 'admin', disabled: { $ne: true } }, { session })) {
      if (!adminEmail) fail(400, 'Set SEED_ADMIN_EMAIL in backend/.env for the first administrator.');
      const user = await db.collection('users').findOne({ email: adminEmail }, { session });
      if (user?.disabled) fail(409, 'The chosen administrator account is disabled. Choose another email or restore it through an authorized administrator.');
      adminId = user?.id || randomUUID();
      const created_at = timestamp();
      if (user) {
        // Keep the existing login password and profile when promoting an account.
        await db.collection('users').updateOne({ id: user.id }, { $set: { role: 'admin', vendor_status: null } }, { session });
        await db.collection('sessions').deleteMany({ user_id: user.id }, { session });
        administrator = 'promoted';
      } else {
        preparedHash ||= await hashPassword(password);
        if (!options.adminPassword && typeof options.saveCredentials !== 'function') fail(400, 'Provide SEED_ADMIN_PASSWORD or a local credential writer before creating an administrator.');
        if (!options.adminPassword) await options.saveCredentials({ email: adminEmail, password });
        await db.collection('users').insertOne({ id: adminId, email: adminEmail, password_hash: preparedHash, full_name: 'Unimall Administrator',
          store_name: null, role: 'admin', vendor_status: null, email_verified: true, created_at, commerce_version: 0 }, { session });
        administrator = 'created';
      }
      await db.collection('profiles').updateOne({ user_id: adminId }, { $setOnInsert: {
        id: randomUUID(), user_id: adminId, full_name: user?.full_name || 'Unimall Administrator', store_name: user?.store_name || null,
        verified: false, rating: 0, notification_preferences: {}, created_at, updated_at: created_at,
      } }, { session, upsert: true });
      await db.collection('system_logs').insertOne({ id: randomUUID(), user_id: adminId, type: 'security', source: 'database_seed',
        message: administrator === 'created' ? 'Initial administrator created by database seed' : 'Initial administrator assigned by database seed', created_at }, { session });
    }
    const added = { settings: 0, pages: 0, menus: 0 };
    const insertDefault = async (table, filter, value, countKey) => {
      const now = timestamp();
      const result = await db.collection(table).updateOne(filter, { $setOnInsert: { id: randomUUID(), ...value, created_at: now, updated_at: now } }, { session, upsert: true });
      added[countKey] += result.upsertedCount || 0;
    };
    for (const [category, settings] of Object.entries(DEFAULT_SETTINGS)) {
      for (const [key, value] of Object.entries(settings)) await insertDefault('site_settings', { setting_key: key }, { setting_key: key, setting_value: value, setting_category: category }, 'settings');
    }
    for (const page of DEFAULT_PAGES) await insertDefault('site_pages', { slug: page.slug }, { ...page, meta_title: page.title, meta_description: '' }, 'pages');
    for (const menu of DEFAULT_MENUS) await insertDefault('navigation_menus', { seed_key: 'baseline_' + menu.menu_location }, { ...menu, seed_key: 'baseline_' + menu.menu_location }, 'menus');
    return { administrator, added };
  });
}
