import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { fail, hasRole, identity, timestamp, verifyPassword } from './security.mjs';

export const FINANCE_COLLECTIONS = ['payments', 'vendor_earnings', 'ledger_accounts', 'ledger_entries', 'payout_accounts', 'payout_batches', 'payouts', 'refunds', 'disputes', 'webhook_events', 'provider_reconciliations', 'finance_jobs', 'finance_settings'];
export const id = () => crypto.randomUUID();
export const money = (n, label = 'amount') => {
  if (!Number.isSafeInteger(n) || n < 0 || n > 100000000000) fail(400, `Invalid ${label}; use nonnegative integer pesewas.`);
  return n;
};
export function commission(amount, bps = 500) {
  money(amount); if (!Number.isInteger(bps) || bps < 0 || bps > 10000) fail(400, 'Commission must be between 0 and 10000 basis points.');
  return Number((BigInt(amount) * BigInt(bps) + 5000n) / 10000n);
}
export const admin = user => { identity(user); if (!hasRole(user, 'admin', 'super_admin')) fail(403, 'Only finance administrators can perform this action.'); };
export const seller = user => { identity(user); if (!hasRole(user, 'vendor', 'admin', 'super_admin') || (user.role === 'vendor' && user.vendor_status !== 'approved')) fail(403, 'Only approved sellers can access finance.'); };
export async function reauthenticate(user, password) {
  if (!await verifyPassword(password, user?.password_hash)) fail(403, 'Confirm this action with your current password.', 'REAUTHENTICATION_REQUIRED');
}
export async function serialize(db, session) {
  // A shared transactional write makes concurrent financial decisions retry against fresh state.
  await db.collection('revisions').updateOne({ _id: 'finance' }, { $inc: { version: 1 } }, { session, upsert: true });
}
export async function financeAudit(db, session, actor, action, metadata = {}) {
  await db.collection('system_logs').insertOne({ id: id(), user_id: actor?.id || 'finance-worker', type: 'security', source: 'finance', message: action, metadata, created_at: timestamp() }, { session });
}
export async function notice(db, session, userId, title, message, link = '/vendor/finance') {
  await db.collection('notifications').insertOne({ id: id(), user_id: userId, title, message, link, type: 'info', read: false, created_at: timestamp() }, { session });
}
export async function financeSettings(db, config = {}, session) {
  const saved = await db.collection('finance_settings').findOne({ id: 'platform' }, { session });
  return { commission_bps: 500, minimum_payout_pesewas: 2000, waiting_hours: 48, delivery_fee_pesewas: 0, tax_bps: 0,
    cod_enabled: true, cod_vendor_ids: [], cod_categories: [], max_cod_receivable_pesewas: 100000, cod_offset_authorized: false,
    high_value_approval_pesewas: 100000, estimated_processing_fee_bps: 0, estimated_transfer_fee_pesewas: 0,
    ...(config.financeDefaults || {}), ...(saved || {}) };
}
export async function ledger(db, session, key, lines, metadata = {}) {
  if (await db.collection('ledger_entries').findOne({ key }, { session })) return false;
  let debits = 0, credits = 0;
  for (const l of lines) { money(l.debit || 0); money(l.credit || 0); if (!l.account || (!!l.debit === !!l.credit)) fail(500, 'Invalid ledger posting.'); debits += l.debit || 0; credits += l.credit || 0; }
  if (!Number.isSafeInteger(debits) || debits !== credits || !debits) fail(500, 'Unbalanced ledger posting.');
  const entry = { id: id(), key, currency: 'GHS', lines, metadata, created_at: timestamp(), version: 1 };
  await db.collection('ledger_entries').insertOne(entry, { session });
  for (const l of lines) await db.collection('ledger_accounts').updateOne({ id: l.account }, { $inc: { debit: l.debit || 0, credit: l.credit || 0 }, $setOnInsert: { currency: 'GHS' } }, { session, upsert: true });
  return true;
}
export const debit = (account, amount) => ({ account, debit: money(amount) });
export const credit = (account, amount) => ({ account, credit: money(amount) });
export const postings = lines => lines.filter(l => (l.debit || l.credit) > 0);
export const account = (kind, vendor) => `${kind}:${vendor}`;
export async function balance(db, name, session, debitNormal = false) {
  const a = await db.collection('ledger_accounts').findOne({ id: name }, { session });
  return debitNormal ? (a?.debit || 0) - (a?.credit || 0) : (a?.credit || 0) - (a?.debit || 0);
}
export function encrypt(value, config) {
  if (!/^[a-f0-9]{64}$/i.test(config.payoutEncryptionKey || '')) fail(503, 'Payout data encryption requires a 64-character hex key.');
  const key = Buffer.from(config.payoutEncryptionKey || '', 'hex');
  if (key.length !== 32) fail(503, 'Payout data encryption is not configured.');
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  const bytes = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), bytes].map(b => b.toString('base64')).join('.');
}
export function decrypt(value, config) {
  const [iv, tag, bytes] = value.split('.').map(v => Buffer.from(v, 'base64'));
  const cipher = createDecipheriv('aes-256-gcm', Buffer.from(config.payoutEncryptionKey, 'hex'), iv); cipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([cipher.update(bytes), cipher.final()]).toString('utf8'));
}
export function fridayCutoff(now = new Date()) {
  // Africa/Accra is UTC year-round. Never use the execution host's local timezone.
  const result = new Date(now); result.setUTCHours(10, 0, 0, 0);
  result.setUTCDate(result.getUTCDate() - (result.getUTCDay() + 2) % 7);
  if (result > now) result.setUTCDate(result.getUTCDate() - 7);
  return { key: result.toISOString().slice(0, 10), at: result.toISOString() };
}
export async function queue(db, session, key, type, entityId) {
  await db.collection('finance_jobs').updateOne({ id: key }, { $setOnInsert: { type, entity_id: entityId, status: 'pending', created_at: timestamp(), attempts: 0, lease_until: '' } }, { session, upsert: true });
}
export async function initializeFinance(db) {
  for (const name of FINANCE_COLLECTIONS) await db.collection(name).createIndex({ id: 1 }, { unique: true });
  for (const [name, fields] of [['payments', { reference: 1 }], ['ledger_entries', { key: 1 }], ['vendor_earnings', { order_item_id: 1 }], ['webhook_events', { provider: 1, event_key: 1 }], ['payouts', { transfer_reference: 1 }], ['payout_batches', { schedule_key: 1 }], ['refunds', { request_id: 1 }]]) await db.collection(name).createIndex(fields, { unique: true });
  await db.collection('payments').createIndex({ order_id: 1 }, { unique: true });
  for (const collection of ['payments', 'payouts', 'refunds']) await db.collection(collection).createIndex({ provider_id: 1, mode: 1 }, { unique: true, partialFilterExpression: { provider_id: { $type: 'string' } } });
  await db.collection('payout_accounts').createIndex({ vendor_id: 1 }, { unique: true });
  await db.collection('payout_accounts').createIndex({ provider: 1, identity_hash: 1 }, { unique: true });
  for (const name of ['vendor_earnings', 'payouts', 'refunds', 'disputes']) await db.collection(name).createIndex({ vendor_id: 1, status: 1, eligible_at: 1 });
  await db.collection('payments').createIndex({ status: 1, expires_at: 1 });
  await db.collection('finance_jobs').createIndex({ status: 1, lease_until: 1 });
  await db.collection('provider_reconciliations').createIndex({ status: 1, created_at: -1 });
}
