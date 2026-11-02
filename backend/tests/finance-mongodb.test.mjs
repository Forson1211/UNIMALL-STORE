import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';
import { configuration } from '../config.mjs';
import { configureMongoDns } from '../mongo-dns.mjs';
import { initializeDatabase } from '../db.mjs';
import { hashPassword } from '../security.mjs';
import { balance } from '../finance-model.mjs';
import * as finance from '../finance.mjs';
import { commerceRpc } from '../commerce.mjs';

test('real MongoDB finance: concurrent collection, batch reservation, approval, refunds and worker claims are idempotent', { skip: process.env.RUN_FINANCE_DB_TESTS !== 'true', timeout: 180000 }, async () => {
  const config = { ...configuration(), paymentsEnabled: true, payoutsEnabled: true, paystackTestMode: true, paystackSecretKey: 'sk_test_fake_provider_only', payoutEncryptionKey: 'ab'.repeat(32), financeDefaults: { waiting_hours: 0 } };
  if (process.env.TEST_MONGODB_URI) config.uri = process.env.TEST_MONGODB_URI;
  await configureMongoDns(config);
  const client = new MongoClient(config.uri, { serverSelectionTimeoutMS: 10000, appName: 'UnimallFinanceIsolatedTest' });
  const database = 'unimall_fin_' + crypto.randomUUID().replaceAll('-', '').slice(0, 20);
  assert.match(database, /^unimall_fin_[a-f0-9]{20}$/);
  const db = client.db(database);
  try {
    await client.connect(); await initializeDatabase(db);
    const password = 'test-finance-only-password', password_hash = await hashPassword(password);
    const buyer = { id: 'buyer', role: 'buyer', email: 'buyer@test.invalid', password_hash };
    const vendor = { id: 'vendor', role: 'vendor', vendor_status: 'approved', email: 'seller@test.invalid', password_hash };
    const admin = { id: 'admin', role: 'admin', email: 'admin@test.invalid', password_hash };
    await db.collection('users').insertMany([buyer, vendor, admin]);
    await db.collection('products').insertMany(['p', 'p2'].map(id => ({ id, vendor_id: 'vendor', name: 'Test item', price: 200, stock: 3, is_active: true })));
    let calls = 0;
    const provider = {
      initialize: async () => ({ authorization_url: 'https://checkout.paystack.com/test' }),
      verifyPayment: async reference => { const p = await db.collection('payments').findOne({ reference }); return { id: p.id, reference, currency: 'GHS', domain: 'test', amount: p.amount_pesewas, status: 'success', fees: 0, metadata: { payment_id: p.id, order_id: p.order_id } }; },
      createRecipient: async d => ({ active: true, recipient_code: 'RCP_test', currency: 'GHS', details: { ...d, account_name: 'Seller' } }),
      transfer: async () => { calls++; return { status: 'pending' }; },
      verifyTransfer: async reference => { const p = await db.collection('payouts').findOne({ transfer_reference: reference }); return { id: 2, reference, currency: 'GHS', domain: 'test', amount: p.amount_pesewas, recipient: { recipient_code: p.recipient_code }, status: 'pending' }; },
      balances: async () => [{ currency: 'GHS', balance: await balance(db, 'provider_cash', undefined, true) }], transactions: async () => [], transfers: async () => [], settlements: async () => [],
    };
    const ctx = { db, client, config, provider, user: buyer }, staff = { ...ctx, user: admin };
    const input = { request_id: 'concurrent-checkout', payment_method: 'paystack', items: [{ id: 'p', quantity: 1 }, { id: 'p2', quantity: 1 }], shipping_details: { fullName: 'Test Buyer', email: buyer.email, phone: '0240000000', address: 'Test campus address' } };
    const checkouts = await Promise.all([finance.createCheckout(ctx, input), finance.createCheckout(ctx, input)]);
    assert.equal(checkouts[0].order_id, checkouts[1].order_id);
    const result = checkouts[0];
    await Promise.all(Array.from({ length: 4 }, () => finance.verifyPayment(ctx, result.payment.id)));
    assert.equal(await db.collection('vendor_earnings').countDocuments(), 2);
    assert.equal(await db.collection('ledger_entries').countDocuments({ key: 'collection:' + result.payment.id }), 1);
    assert.equal(await balance(db, 'vendor_pending:vendor'), 38000);
    for (const state of ['confirmed', 'shipped', 'delivered']) await commerceRpc({ ...ctx, user: vendor }, 'update_order_fulfillment', { _order_id: result.order_id, _new_status: state });
    const items = await db.collection('order_items').find({ order_id: result.order_id }).toArray();
    await Promise.all(items.map(item => finance.confirmDelivery(ctx, item.id)));
    await finance.releaseEligible(ctx, new Date(Date.now() + 1000));
    await finance.setPayoutAccount({ ...ctx, user: vendor }, { password, type: 'mobile_money', name: 'Seller', bank_code: 'MTN', account_number: '0240000000' });
    const friday = new Date('2099-01-02T12:00:00Z');
    const batches = await Promise.all(Array.from({ length: 4 }, () => finance.createBatch(staff, friday)));
    assert.equal(new Set(batches.map(b => b.id)).size, 1);
    assert.equal(await db.collection('payouts').countDocuments(), 1);
    assert.equal(await balance(db, 'vendor_reserved:vendor'), 38000);
    await Promise.all([finance.approveBatch(staff, batches[0].id, { password }), finance.approveBatch(staff, batches[0].id, { password })]);
    await db.collection('provider_reconciliations').insertOne({ id: 'verified-report', kind: 'daily', status: 'matched', created_at: new Date().toISOString() });
    await Promise.all([finance.runFinance({ ...ctx, user: undefined }), finance.runFinance({ ...ctx, user: undefined })]);
    assert.equal(calls, 1); assert.equal(await balance(db, 'vendor_reserved:vendor'), 38000);
    // Separate fresh checkout tests simultaneous item refunds against one parent payment.
    const second = await finance.createCheckout(ctx, { ...input, request_id: 'second-order-refunds' });
    await finance.verifyPayment(ctx, second.payment.id);
    const refundItems = await db.collection('order_items').find({ order_id: second.order_id }).toArray();
    const refunds = await Promise.all(refundItems.map((item, i) => finance.requestRefund(staff, { password, request_id: 'refund-concurrent-' + i, order_item_id: item.id, amount_pesewas: 20000, reason: 'Test refund' })));
    for (const r of refunds) await db.collection('refunds').updateOne({ id: r.id }, { $set: { provider_id: r.id, status: 'pending' } });
    provider.verifyRefund = async id => { const r = await db.collection('refunds').findOne({ id }); return { id, amount: r.amount_pesewas, currency: 'GHS', status: 'processed', transaction: { reference: second.payment.reference } }; };
    await Promise.all(refunds.map(r => finance.settleRefund({ ...ctx, user: undefined }, r.id)));
    const final = await db.collection('payments').findOne({ id: second.payment.id });
    assert.equal(final.refunded_pesewas, 40000); assert.equal(final.status, 'refunded');
    for (const entry of await db.collection('ledger_entries').find().toArray()) assert.equal(entry.lines.reduce((sum, l) => sum + (l.debit || 0) - (l.credit || 0), 0), 0);
  } finally {
    try { assert.equal(db.databaseName, database); assert.match(database, /^unimall_fin_[a-f0-9]{20}$/); await db.dropDatabase(); }
    finally { await client.close(); }
  }
});
