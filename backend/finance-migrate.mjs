import { configuration } from './config.mjs';
import { connectDatabase, transact } from './db.mjs';
import { encrypt, financeAudit } from './finance-model.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Dry run by default. Existing financial history is never inferred from delivery status.
export async function migrateFinance({ db, client, config }, apply = false) {
  const counts = {
    legacy_orders: await db.collection('orders').countDocuments({ finance_version: { $exists: false } }),
    legacy_items: await db.collection('order_items').countDocuments({ finance_version: { $exists: false } }),
    plaintext_accounts: await db.collection('vendor_payment_methods').countDocuments({ encrypted_details: { $exists: false }, details: { $exists: true } }),
    plaintext_payouts: await db.collection('payout_requests').countDocuments({ encrypted_payment_details: { $exists: false }, payment_details: { $exists: true } }),
  };
  if (!apply) return { mode: 'dry-run', ...counts };
  // Validate encryption before modifying anything, including legacy metadata.
  encrypt({}, config);
  await transact(client, async session => {
    for (const [collection, source, target] of [['vendor_payment_methods', 'details', 'encrypted_details'], ['payout_requests', 'payment_details', 'encrypted_payment_details']]) {
      const records = await db.collection(collection).find({ [target]: { $exists: false }, [source]: { $exists: true } }, { session }).toArray();
      for (const r of records) {
        const number = String(r[source]?.accountNumber || r[source]?.account_number || '');
        await db.collection(collection).updateOne({ id: r.id }, { $set: { [target]: encrypt(r[source], config), [source]: { masked_account: number ? '****' + number.slice(-4) : 'Archived destination' }, finance_version: 0, requires_reverification: true } }, { session });
      }
    }
    for (const collection of ['orders', 'order_items']) await db.collection(collection).updateMany({ finance_version: { $exists: false } }, { $set: { finance_version: 0, finance_migration: 'legacy-unverified-v1' } }, { session });
    await db.collection('finance_settings').updateOne({ id: 'migration-v1' }, { $set: { completed_at: new Date().toISOString(), counts }, $setOnInsert: { version: 1 } }, { session, upsert: true });
    await financeAudit(db, session, null, 'Legacy finance metadata and encrypted destinations migrated; no historical earnings created', counts);
  });
  return { mode: 'applied', ...counts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = configuration(), connection = await connectDatabase(config);
  try { console.log(JSON.stringify(await migrateFinance({ ...connection, config }, process.argv.includes('--apply')))); }
  finally { await connection.client.close(); }
}
