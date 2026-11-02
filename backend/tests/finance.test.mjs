import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createHmac } from 'node:crypto';
import { fixture } from './fixtures.mjs';
import { configuration } from '../config.mjs';
import { createApp } from '../app.mjs';
import { hashPassword, digest } from '../security.mjs';
import { commission, fridayCutoff, ledger, debit, credit, balance, encrypt, decrypt } from '../finance-model.mjs';
import { paymentGate, verifySignature } from '../paystack.mjs';
import * as finance from '../finance.mjs';
import { commerceRpc } from '../commerce.mjs';
import { migrateFinance } from '../finance-migrate.mjs';

const password = 'finance-test-password';
const passwordHash = await hashPassword(password);
const buyer = { id: 'buyer', role: 'buyer', email: 'buyer@example.com', password_hash: passwordHash };
const vendor = { id: 'vendor', role: 'vendor', vendor_status: 'approved', email: 'seller@example.com', password_hash: passwordHash };
const administrator = { id: 'admin', role: 'admin', password_hash: passwordHash };
function setup(second = false) {
  const config = { ...configuration({}), paymentsEnabled: true, payoutsEnabled: true, paystackSecretKey: 'sk_test_unit_test_only', paystackTestMode: true, payoutEncryptionKey: 'ab'.repeat(32), financeDefaults: { waiting_hours: 0 }, checkoutExpiryMinutes: 30 };
  const f = fixture({ users: [buyer, vendor, administrator, { id: 'vendor2', role: 'vendor', vendor_status: 'approved' }],
    products: [{ id: 'product', vendor_id: 'vendor', name: 'Campus item', price: 200, stock: 10, is_active: true }, ...(second ? [{ id: 'product2', vendor_id: 'vendor2', name: 'Second item', price: 100, stock: 10, is_active: true }] : [])] });
  let calls = 0, transferCalls = 0, transferState = 'pending', refundState = 'pending', unknown = false;
  const provider = {
    initialize: async () => { calls++; return { authorization_url: 'https://checkout.paystack.com/test-session' }; },
    verifyPayment: async ref => { const p = f.rows('payments').find(p => p.reference === ref); return { id: 99, reference: ref, amount: p.amount_pesewas, currency: 'GHS', domain: 'test', status: 'success', fees: 100, metadata: { order_id: p.order_id, payment_id: p.id } }; },
    createRecipient: async d => ({ active: true, currency: 'GHS', recipient_code: 'RCP_test', details: { ...d, account_name: 'Test Seller' } }),
    transfer: async () => { transferCalls++; if (unknown) throw new Error('timeout'); return { status: 'success' }; },
    verifyTransfer: async ref => { const p = f.rows('payouts').find(p => p.transfer_reference === ref); return { id: 101, reference: ref, amount: p.amount_pesewas, currency: 'GHS', domain: 'test', status: transferState, recipient: { recipient_code: p.recipient_code }, fee_charged: 20 }; },
    refund: async (r, p) => { f.rows('provider_refunds').push({ id: 201, amount: r.amount_pesewas, currency: 'GHS', transaction: { reference: p.reference }, merchant_note: r.id }); return { id: 201 }; },
    verifyRefund: async () => ({ ...f.rows('provider_refunds')[0], status: refundState }),
    balances: async () => [{ currency: 'GHS', balance: await balance(f.db, 'provider_cash', undefined, true) }],
    transactions: async () => [], transfers: async () => [], settlements: async () => [],
  };
  const ctx = { ...f, config, provider, user: buyer };
  const input = { request_id: 'checkout-test-request', payment_method: 'paystack', items: [{ id: 'product', quantity: 1 }], total_amount: 1,
    shipping_details: { fullName: 'Test Buyer', email: buyer.email, phone: '0240000000', address: 'Campus hostel room 10' } };
  return { ...f, ctx, input, provider, calls: () => calls, transferCalls: () => transferCalls, setTransfer: state => { transferState = state; }, setRefund: state => { refundState = state; }, timeout: () => { unknown = true; } };
}
async function paid(f) { const result = await finance.createCheckout(f.ctx, f.input); await finance.verifyPayment(f.ctx, result.payment.id); return result; }
async function delivered(f, orderId) {
  for (const state of ['confirmed', 'shipped', 'delivered']) await commerceRpc({ ...f.ctx, user: vendor }, 'update_order_fulfillment', { _order_id: orderId, _new_status: state });
  const line = f.rows('order_items').find(i => i.order_id === orderId && i.vendor_id === vendor.id);
  await finance.confirmDelivery(f.ctx, line.id);
  await finance.releaseEligible(f.ctx, new Date(Date.now() + 1000));
  return line;
}
async function recipient(f) { return finance.setPayoutAccount({ ...f.ctx, user: vendor }, { password, type: 'mobile_money', name: 'Test Seller', account_number: '0240000000', bank_code: 'MTN' }); }
function balanced(f) {
  for (const entry of f.rows('ledger_entries')) assert.equal(entry.lines.reduce((sum, l) => sum + (l.debit || 0) - (l.credit || 0), 0), 0, entry.key);
}

test('5% commission uses deterministic integer rounding; Friday cutoffs use Ghana time', () => {
  assert.equal(commission(20000), 1000); assert.equal(20000 - commission(20000), 19000);
  assert.equal(commission(1), 0); assert.equal(commission(10), 1); assert.equal(commission(19999), 1000);
  assert.throws(() => commission(1.01)); assert.throws(() => commission(-1));
  assert.equal(fridayCutoff(new Date('2026-10-30T09:59:59Z')).key, '2026-10-23');
  assert.equal(fridayCutoff(new Date('2026-10-30T10:00:00Z')).at, '2026-10-30T10:00:00.000Z');
  assert.equal(fridayCutoff(new Date('2026-11-02T12:00:00Z')).key, '2026-10-30');
});
test('ledger rejects unbalanced entries and appends idempotent journals; payout encryption is authenticated', async () => {
  const f = setup();
  await assert.rejects(ledger(f.db, null, 'bad', [debit('cash', 10), credit('liability', 9)]));
  await ledger(f.db, null, 'one', [debit('cash', 10), credit('liability', 10)]);
  await ledger(f.db, null, 'one', [debit('cash', 10), credit('liability', 10)]);
  assert.equal(f.rows('ledger_entries').length, 1);
  const encrypted = encrypt({ account_number: '0240000000' }, f.ctx.config);
  assert.ok(!encrypted.includes('0240000000')); assert.equal(decrypt(encrypted, f.ctx.config).account_number, '0240000000');
  assert.throws(() => decrypt(encrypted, { payoutEncryptionKey: 'cd'.repeat(32) }));
});
test('live-money activation fails closed and webhook signatures authenticate exact raw bytes', () => {
  assert.throws(() => paymentGate({ paymentsEnabled: true, paystackSecretKey: 'sk_live_example', paystackTestMode: false }));
  assert.throws(() => paymentGate({ paymentsEnabled: true, paystackSecretKey: 'sk_live_example', paystackTestMode: true }));
  const bytes = Buffer.from('{ "event":"charge.success" }'), key = 'test';
  const signature = createHmac('sha512', key).update(bytes).digest('hex');
  assert.equal(verifySignature(bytes, signature, key), true); assert.equal(verifySignature(Buffer.from('{}'), signature, key), false);
});
test('checkout ignores forged totals and creates stable multi-vendor money snapshots before provider initialization', async () => {
  const f = setup(true); f.input.items.push({ id: 'product2', quantity: 1 });
  const result = await finance.createCheckout(f.ctx, f.input);
  assert.equal(result.payment.amount_pesewas, 30000); assert.equal(f.rows('vendor_earnings').length, 0);
  assert.equal(f.rows('order_items').reduce((n, l) => n + l.commission_pesewas, 0), 1500);
  assert.equal((await finance.createCheckout(f.ctx, f.input)).order_id, result.order_id);
  assert.equal(f.calls(), 1); assert.equal(f.rows('products')[0].stock, 9);
  await finance.verifyPayment(f.ctx, result.payment.id); await finance.verifyPayment(f.ctx, result.payment.id);
  assert.equal(f.rows('vendor_earnings').length, 2); assert.equal(f.rows('ledger_entries').filter(e => e.key.startsWith('collection:')).length, 1);
  assert.equal(await balance(f.db, 'vendor_pending:vendor'), 19000); balanced(f);
});
test('invalid verification cannot create earnings and payment does not permit unpaid fulfillment', async () => {
  const f = setup(), r = await finance.createCheckout(f.ctx, f.input);
  await assert.rejects(commerceRpc({ ...f.ctx, user: vendor }, 'update_order_fulfillment', { _order_id: r.order_id, _new_status: 'confirmed' }), { status: 409 });
  f.provider.verifyPayment = async () => ({ reference: r.payment.reference, currency: 'USD', amount: 20000, status: 'success', domain: 'test' });
  await assert.rejects(finance.verifyPayment(f.ctx, r.payment.id)); assert.equal(f.rows('vendor_earnings').length, 0);
});
test('seller delivery alone cannot unlock earnings; buyer confirmation, waiting period and dispute holds apply', async () => {
  const f = setup(), r = await paid(f);
  for (const s of ['confirmed', 'shipped', 'delivered']) await commerceRpc({ ...f.ctx, user: vendor }, 'update_order_fulfillment', { _order_id: r.order_id, _new_status: s });
  assert.equal(await finance.releaseEligible(f.ctx), 0);
  const line = f.rows('order_items')[0];
  await assert.rejects(finance.confirmDelivery({ ...f.ctx, user: vendor }, line.id), { status: 404 });
  await finance.confirmDelivery(f.ctx, line.id);
  await finance.openDispute(f.ctx, { order_item_id: line.id, reason: 'The supplied item is damaged.' });
  assert.equal(await finance.releaseEligible(f.ctx), 0);
  await finance.resolveDispute({ ...f.ctx, user: administrator }, f.rows('disputes')[0].id, { password, decision: 'seller', reason: 'Buyer evidence was reviewed and delivery accepted.' });
  assert.equal(await finance.releaseEligible(f.ctx, new Date(Date.now() + 1000)), 1); assert.equal(await balance(f.db, 'commission_revenue'), 1000); balanced(f);
});
test('cancelled/expired checkout releases stock once and a late successful payment queues refund without earnings', async () => {
  const f = setup(), r = await finance.createCheckout(f.ctx, f.input);
  f.rows('payments')[0].expires_at = '2020-01-01T00:00:00Z';
  await finance.expirePayment(f.ctx, r.payment.id); await finance.expirePayment(f.ctx, r.payment.id);
  assert.equal(f.rows('products')[0].stock, 10);
  await finance.verifyPayment(f.ctx, r.payment.id);
  assert.equal(f.rows('vendor_earnings').length, 0); assert.equal(f.rows('refunds').length, 1); assert.equal(await balance(f.db, 'refund_payable'), 20000); balanced(f);
});
test('weekly minimum carries forward, batch creation and approval are idempotent, pending transfer stays reserved', async () => {
  const f = setup(), r = await paid(f); await delivered(f, r.order_id); await recipient(f);
  const friday = new Date('2099-01-02T12:00:00Z');
  const batch = await finance.createBatch({ ...f.ctx, user: administrator }, friday);
  assert.equal((await finance.createBatch(f.ctx, friday)).id, batch.id);
  assert.equal(f.rows('payouts').length, 1); assert.equal(batch.amount_pesewas, 19000);
  const adminCtx = { ...f.ctx, user: administrator };
  await assert.rejects(finance.approveBatch({ ...f.ctx, user: { id: 'mod', role: 'moderator' } }, batch.id, { password }), { status: 403 });
  await finance.approveBatch(adminCtx, batch.id, { password }); await finance.approveBatch(adminCtx, batch.id, { password });
  assert.equal(f.rows('finance_jobs').filter(j => j.type === 'transfer').length, 1);
  f.rows('provider_reconciliations').push({ id: 'matched', kind: 'daily', status: 'matched', created_at: new Date().toISOString() });
  await finance.runFinance(f.ctx);
  assert.equal(f.transferCalls(), 1); assert.equal(f.rows('payouts')[0].status, 'processing');
  await finance.settleTransfer(f.ctx, f.rows('payouts')[0].id);
  assert.equal(await balance(f.db, 'vendor_reserved:vendor'), 19000);
  assert.equal(f.rows('vendor_earnings')[0].status, 'reserved');
  f.setTransfer('success'); await finance.settleTransfer(f.ctx, f.rows('payouts')[0].id); await finance.settleTransfer(f.ctx, f.rows('payouts')[0].id);
  assert.equal(f.rows('vendor_earnings')[0].status, 'paid'); assert.equal(await balance(f.db, 'vendor_reserved:vendor'), 0); balanced(f);
});
test('transfer timeout is never blindly resubmitted; confirmed failure releases exact reservation', async () => {
  const f = setup(), r = await paid(f); await delivered(f, r.order_id); await recipient(f);
  const batch = await finance.createBatch(f.ctx, new Date('2099-01-02T12:00:00Z'));
  await finance.approveBatch({ ...f.ctx, user: administrator }, batch.id, { password }); f.timeout();
  f.rows('provider_reconciliations').push({ id: 'matched', kind: 'daily', status: 'matched', created_at: new Date().toISOString() });
  await finance.runFinance(f.ctx); await finance.runFinance(f.ctx);
  assert.equal(f.transferCalls(), 1); assert.equal(await balance(f.db, 'vendor_reserved:vendor'), 19000);
  f.setTransfer('failed'); await finance.settleTransfer(f.ctx, f.rows('payouts')[0].id);
  assert.equal(await balance(f.db, 'vendor_reserved:vendor'), 0); assert.equal(await balance(f.db, 'vendor_available:vendor'), 19000); balanced(f);
});
test('refund proration reconciles every pesewa; post-payout refunds create separate debt', async () => {
  const f = setup(), r = await paid(f), line = await delivered(f, r.order_id);
  const adminCtx = { ...f.ctx, user: administrator };
  await finance.requestRefund(adminCtx, { password, request_id: 'refund-request-one', order_item_id: line.id, amount_pesewas: 10001, reason: 'Partial item refund' });
  await finance.runFinance(f.ctx); f.setRefund('processed');
  await finance.settleRefund(f.ctx, f.rows('refunds')[0].id); await finance.settleRefund(f.ctx, f.rows('refunds')[0].id);
  assert.equal(f.rows('vendor_earnings')[0].refunded_pesewas, 10001); assert.equal(f.rows('vendor_earnings')[0].refunded_commission_pesewas, 500);
  const e = f.rows('vendor_earnings')[0]; e.status = 'paid'; // Model a separately confirmed payout for the remaining liability.
  await ledger(f.db, null, 'test-settled', [debit('vendor_available:vendor', e.remaining_pesewas), credit('provider_cash', e.remaining_pesewas)]);
  f.rows('provider_refunds').length = 0;
  await finance.requestRefund(adminCtx, { password, request_id: 'refund-request-two', order_item_id: line.id, amount_pesewas: 9999, reason: 'Remaining item refund' });
  await finance.runFinance(f.ctx); await finance.settleRefund(f.ctx, f.rows('refunds')[1].id);
  assert.equal(f.rows('vendor_earnings')[0].refunded_commission_pesewas, 1000); assert.equal(await balance(f.db, 'vendor_debt:vendor', null, true), 9499); balanced(f);
});
test('COD creates no online earnings and requires buyer plus vendor confirmation before recording commission debt', async () => {
  const f = setup(); f.input.payment_method = 'cod'; const r = await finance.createCheckout(f.ctx, f.input);
  await delivered(f, r.order_id);
  const staff = { ...f.ctx, user: administrator };
  await assert.rejects(finance.collectCod(staff, r.order_id), { status: 409 });
  const line = f.rows('order_items')[0]; f.rows('order_items')[0].buyer_cash_confirmed_at = new Date().toISOString();
  await finance.confirmCodVendor({ ...f.ctx, user: vendor }, r.order_id);
  await finance.collectCod(staff, r.order_id); await finance.collectCod(staff, r.order_id);
  assert.equal(f.rows('vendor_earnings').length, 0); assert.equal(await balance(f.db, 'cod_receivable:vendor', null, true), 1000);
  assert.equal(line.entitlement_pesewas, 19000); balanced(f);
});
test('financial endpoints enforce role and ownership; raw signed webhook is queued once', async t => {
  const f = setup(); const r = await finance.createCheckout(f.ctx, f.input);
  const server = createApp({ ...f, config: f.ctx.config, financeProvider: f.provider }).listen(0, '127.0.0.1');
  await once(server, 'listening'); t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  assert.equal((await fetch(base + '/admin/finance/overview')).status, 401);
  assert.equal((await fetch(base + '/vendor/finance/summary')).status, 401);
  assert.equal((await fetch(base + '/payments/' + r.payment.id)).status, 401);
  const body = JSON.stringify({ event: 'charge.success', data: { id: 99, reference: r.payment.reference, status: 'success' } });
  assert.equal((await fetch(base + '/webhooks/paystack', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': 'invalid' }, body })).status, 401);
  const signature = createHmac('sha512', f.ctx.config.paystackSecretKey).update(body).digest('hex');
  for (let n = 0; n < 2; n++) assert.equal((await fetch(base + '/webhooks/paystack', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature }, body })).status, 200);
  assert.equal(f.rows('webhook_events').length, 1); assert.equal(f.rows('vendor_earnings').length, 0);
  await finance.runFinance(f.ctx); assert.equal(f.rows('vendor_earnings').length, 1);
});

test('stale transfer failure cannot release paid earnings, and repeated confirmed failure is harmless', async () => {
  for (const terminal of ['success', 'failed']) {
    const f = setup(), r = await paid(f); await delivered(f, r.order_id); await recipient(f);
    const batch = await finance.createBatch(f.ctx, new Date('2099-01-02T12:00:00Z'));
    await finance.approveBatch({ ...f.ctx, user: administrator }, batch.id, { password });
    f.rows('payouts')[0].status = 'submitted'; f.setTransfer(terminal);
    await finance.settleTransfer(f.ctx, f.rows('payouts')[0].id);
    const before = await balance(f.db, 'vendor_available:vendor');
    f.setTransfer('failed'); await finance.settleTransfer(f.ctx, f.rows('payouts')[0].id); await finance.settleTransfer(f.ctx, f.rows('payouts')[0].id);
    assert.equal(await balance(f.db, 'vendor_available:vendor'), before);
    assert.equal(f.rows('vendor_earnings')[0].status, terminal === 'success' ? 'paid' : 'eligible'); balanced(f);
  }
});

test('minimum, waiting period, account version and vendor suspension hold payouts without losing earnings', async () => {
  const f = setup(), r = await paid(f); await delivered(f, r.order_id); await recipient(f);
  const adminCtx = { ...f.ctx, user: administrator };
  await finance.updateSettings(adminCtx, { password, minimum_payout_pesewas: 20000 });
  await finance.createBatch(f.ctx, new Date('2099-01-02T12:00:00Z'));
  assert.equal(f.rows('payouts').length, 0); assert.equal(await balance(f.db, 'vendor_available:vendor'), 19000);
  await finance.updateSettings(adminCtx, { password, minimum_payout_pesewas: 2000 });
  const batch = await finance.createBatch(f.ctx, new Date('2099-01-09T12:00:00Z'));
  f.rows('users').find(u => u.id === vendor.id).vendor_status = 'suspended';
  await assert.rejects(finance.approveBatch(adminCtx, batch.id, { password }), { status: 409 });
  assert.equal(await balance(f.db, 'vendor_reserved:vendor'), 19000);
  f.rows('users').find(u => u.id === vendor.id).vendor_status = 'approved';
  f.rows('payout_accounts')[0].version++;
  await assert.rejects(finance.approveBatch(adminCtx, batch.id, { password }), { status: 409 });
  assert.equal(f.rows('payouts')[0].status, 'awaiting_approval'); balanced(f);
});

test('fee reconciliation appends corrections, and corrupted account projections block reconciliation', async () => {
  const f = setup(), r = await paid(f), original = f.provider.verifyPayment;
  f.provider.verifyPayment = async ref => ({ ...await original(ref), fees: 150 });
  await finance.verifyPayment(f.ctx, r.payment.id); await finance.verifyPayment(f.ctx, r.payment.id);
  assert.equal(await balance(f.db, 'processing_expense', null, true), 150);
  assert.equal(await balance(f.db, 'vendor_pending:vendor'), 19000);
  f.rows('ledger_accounts').find(a => a.id === 'vendor_pending:vendor').credit++;
  const report = await finance.reconcile(f.ctx);
  assert.equal(report.status, 'open'); assert.ok(report.issues.some(i => i.kind === 'account_projection')); balanced(f);
});

test('delivery and tax refund uses platform liabilities and remains possible with new checkout disabled', async () => {
  const f = setup(); f.ctx.config.financeDefaults = { waiting_hours: 0, delivery_fee_pesewas: 500, tax_bps: 1000 };
  const r = await paid(f); assert.equal(r.payment.amount_pesewas, 22500);
  f.ctx.config.paymentsEnabled = false;
  const refund = await finance.requestRefund({ ...f.ctx, user: administrator }, { password, payment_id: r.payment.id, request_id: 'refund-order-charges', amount_pesewas: 2500, reason: 'Refund delivery and tax' });
  await finance.runFinance(f.ctx); f.setRefund('processed'); await finance.settleRefund(f.ctx, refund.id);
  assert.equal(await balance(f.db, 'delivery_payable'), 0); assert.equal(await balance(f.db, 'tax_payable'), 0);
  assert.equal(await balance(f.db, 'vendor_pending:vendor'), 19000); assert.equal(f.rows('payments')[0].refunded_pesewas, 2500); balanced(f);
});

test('provider chargebacks require verified resolution and allocate loss once without issuing another refund', async () => {
  const f = setup(), r = await paid(f);
  await finance.acceptEvent(f.ctx, { event: 'charge.dispute.create', data: { id: 987, transaction: { id: 99 } } });
  await finance.runFinance(f.ctx);
  const d = f.rows('disputes')[0]; assert.equal(d.status, 'open');
  f.provider.verifyDispute = async () => ({ id: 987, domain: 'test', status: 'resolved', resolution: 'merchant-accepted', refund_amount: 20000, transaction: { reference: r.payment.reference, currency: 'GHS' } });
  await finance.resolveProviderDispute({ ...f.ctx, user: administrator }, d.id, { password });
  await finance.resolveProviderDispute({ ...f.ctx, user: administrator }, d.id, { password });
  assert.equal(await balance(f.db, 'vendor_pending:vendor'), 0); assert.equal(await balance(f.db, 'deferred_commission'), 0);
  assert.equal(f.rows('payments')[0].status, 'refunded'); assert.equal(f.rows('refunds').length, 0); balanced(f);
});

test('provider funding requires exact API evidence and cannot double-post payment or transfer entries', async () => {
  const f = setup(), ctx = { ...f.ctx, user: administrator };
  f.provider.balanceLedger = async () => [{ id: 800, difference: 50000, currency: 'GHS', domain: 'test', model_responsible: 'Deposit', model_row: 80 }];
  const input = { password, provider_ledger_id: '800', kind: 'funding', reason: 'Confirmed platform bank funding receipt' };
  await finance.recordProviderMovement(ctx, input); await finance.recordProviderMovement(ctx, input);
  assert.equal(await balance(f.db, 'provider_cash', null, true), 50000); assert.equal(await balance(f.db, 'platform_funding'), 50000);
  f.provider.balanceLedger = async () => [{ id: 801, difference: 20000, currency: 'GHS', domain: 'test', model_responsible: 'Transaction' }];
  await assert.rejects(finance.recordProviderMovement(ctx, { ...input, provider_ledger_id: '801' }), { status: 409 }); balanced(f);
});

test('migration encrypts legacy destinations without fabricating paid history; revoked actors cannot change finance rules', async () => {
  const f = setup();
  f.rows('orders').push({ id: 'old-order', total_amount: 200, status: 'delivered', payment_status: 'paid' });
  f.rows('vendor_payment_methods').push({ id: 'old-account', vendor_id: vendor.id, details: { accountNumber: '0240000000' } });
  const before = await migrateFinance(f.ctx); assert.equal(before.mode, 'dry-run'); assert.ok(f.rows('vendor_payment_methods')[0].details.accountNumber);
  await migrateFinance(f.ctx, true);
  assert.equal(f.rows('orders')[0].finance_version, 0); assert.equal(f.rows('vendor_earnings').length, 0);
  const account = f.rows('vendor_payment_methods')[0]; assert.equal(account.details.accountNumber, undefined); assert.ok(account.encrypted_details); assert.equal(decrypt(account.encrypted_details, f.ctx.config).accountNumber, '0240000000');
  f.rows('users').find(u => u.id === administrator.id).role = 'moderator';
  await assert.rejects(finance.updateSettings({ ...f.ctx, user: administrator }, { password, commission_bps: 800 }), { status: 403 });
});

test('HTTP sessions enforce buyer ownership, seller scope and finance-only staff permissions', async t => {
  const f = setup(), r = await paid(f);
  f.rows('users').push({ id: 'mod', role: 'moderator' }, { id: 'super', role: 'super_admin', password_hash: passwordHash });
  for (const u of ['buyer', 'vendor', 'admin', 'mod', 'super']) f.rows('sessions').push({ token_hash: digest('session-' + u), user_id: u, expires_at: new Date(Date.now() + 60000) });
  const server = createApp({ ...f, config: f.ctx.config, financeProvider: f.provider }).listen(0, '127.0.0.1');
  await once(server, 'listening'); t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const get = (path, user) => fetch(base + path, { headers: { Cookie: `${f.ctx.config.cookieName}=session-${user}` } });
  assert.equal((await get('/payments/' + r.payment.id, 'vendor')).status, 404);
  assert.equal((await get('/payments/' + r.payment.id, 'buyer')).status, 200);
  assert.equal((await get('/vendor/finance/summary', 'buyer')).status, 403);
  assert.equal((await get('/admin/finance/overview', 'mod')).status, 403);
  assert.equal((await get('/admin/finance/overview', 'admin')).status, 200);
  assert.equal((await get('/admin/finance/overview', 'super')).status, 200);
  const post = await fetch(base + '/query', { method: 'POST', headers: { Cookie: `${f.ctx.config.cookieName}=session-vendor`, 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'vendor_payment_methods', operation: 'insert', values: { type: 'momo', details: { accountNumber: '0240000000' } } }) });
  assert.equal(post.status, 403);
});

test('a paid transfer reversal needs fresh verified administrator resolution before reuse', async () => {
  const f = setup(), r = await paid(f); await delivered(f, r.order_id); await recipient(f);
  const batch = await finance.createBatch(f.ctx, new Date('2099-01-02T12:00:00Z'));
  await finance.approveBatch({ ...f.ctx, user: administrator }, batch.id, { password });
  const p = f.rows('payouts')[0]; p.status = 'submitted'; f.setTransfer('success'); await finance.settleTransfer(f.ctx, p.id);
  f.setTransfer('reversed'); await finance.settleTransfer(f.ctx, p.id); await finance.settleTransfer(f.ctx, p.id);
  assert.equal(await balance(f.db, 'vendor_reserved:vendor'), 19000); assert.equal(await balance(f.db, 'vendor_available:vendor'), 0);
  await finance.resolveReversedTransfer({ ...f.ctx, user: administrator }, p.id, { password });
  await finance.resolveReversedTransfer({ ...f.ctx, user: administrator }, p.id, { password });
  assert.equal(await balance(f.db, 'vendor_reserved:vendor'), 0); assert.equal(await balance(f.db, 'vendor_available:vendor'), 19000); balanced(f);
});

test('buyer waiting period is enforced and COD receipts allocate commission without online earnings', async () => {
  const f = setup(); f.ctx.config.financeDefaults = { waiting_hours: 48 };
  const r = await paid(f); await delivered(f, r.order_id);
  assert.equal(f.rows('vendor_earnings')[0].status, 'pending');
  await finance.releaseEligible(f.ctx, new Date(Date.now() + 49 * 3600000));
  assert.equal(f.rows('vendor_earnings')[0].status, 'eligible');
  const cod = setup(); cod.input.payment_method = 'cod'; const c = await finance.createCheckout(cod.ctx, cod.input); const line = await delivered(cod, c.order_id);
  await finance.confirmDelivery(cod.ctx, line.id, { cash_paid: true });
  await finance.confirmCodVendor({ ...cod.ctx, user: vendor }, c.order_id); await finance.collectCod({ ...cod.ctx, user: administrator }, c.order_id);
  const ctx = { ...cod.ctx, user: administrator }, input = { password, vendor_id: vendor.id, kind: 'cod', reference: 'bank-receipt-test', amount_pesewas: 1000 };
  await finance.recordReceivableCollection(ctx, input); await finance.recordReceivableCollection(ctx, input); await finance.collectCod(ctx, c.order_id);
  assert.equal(await balance(cod.db, 'cod_receivable:vendor', null, true), 0); assert.equal(cod.rows('order_items')[0].cod_commission_status, 'collected');
  assert.equal(cod.rows('vendor_earnings').length, 0); balanced(cod);
});
