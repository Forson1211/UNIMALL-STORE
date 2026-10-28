import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectDatabase } from '../db.mjs';
import { commerceRpc } from '../commerce.mjs';
import { configuration } from '../config.mjs';

// An explicit test URI is required. Only this test's random database is removed.
test('real MongoDB transactions prevent overselling, roll back failures, and deduplicate concurrent retries', { skip: !process.env.TEST_MONGODB_URI, timeout: 60000 }, async () => {
  const database = 'unimall_test_' + crypto.randomUUID().replaceAll('-', '').slice(0, 20);
  const { db, client } = await connectDatabase({ ...configuration(), uri: process.env.TEST_MONGODB_URI, database });
  try {
    const buyer = { id: 'buyer', role: 'buyer' };
    const seller = { id: 'seller', role: 'vendor', vendor_status: 'approved' };
    await db.collection('users').insertMany([{ ...buyer, email: 'buyer@example.com' }, { ...seller, email: 'seller@example.com' }]);
    await db.collection('products').insertOne({ id: 'p', name: 'Test book', vendor_id: seller.id, is_active: true, stock: 4, price: 10 });
    const ctx = { db, client, user: buyer };
    const params = { _buyer_id: buyer.id, _payment_method: 'cod', _total_amount: 30, _items: [{ id: 'p', quantity: 3 }],
      _shipping_details: { fullName: 'Test Buyer', email: 'buyer@example.com', phone: '0240000000', address: 'Test campus address' } };
    const results = await Promise.allSettled(['request-one', 'request-two'].map(_request_id => commerceRpc(ctx, 'create_order_v2', { ...params, _request_id })));
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal((await db.collection('products').findOne({ id: 'p' })).stock, 1);
    assert.equal(await db.collection('orders').countDocuments(), 1);
    await assert.rejects(commerceRpc(ctx, 'create_order_v2', { ...params, _request_id: 'wrong-total', _total_amount: 1, _items: [{ id: 'p', quantity: 1 }] }), { status: 409 });
    assert.equal((await db.collection('products').findOne({ id: 'p' })).stock, 1);
    const retry = { ...params, _request_id: 'same-request', _total_amount: 10, _items: [{ id: 'p', quantity: 1 }] };
    const ids = await Promise.all([commerceRpc(ctx, 'create_order_v2', retry), commerceRpc(ctx, 'create_order_v2', retry)]);
    assert.equal(ids[0], ids[1]);
    assert.equal((await db.collection('products').findOne({ id: 'p' })).stock, 0);
    assert.equal(await db.collection('orders').countDocuments(), 2);
    const secondBuyer = { id: 'second-buyer', role: 'buyer', email: 'second@example.com' };
    await db.collection('users').insertOne(secondBuyer);
    await db.collection('products').updateOne({ id: 'p' }, { $set: { stock: 4 } });
    await db.collection('coupons').insertOne({ id: 'limited', code: 'LASTUSE', created_by: seller.id, scope: 'vendor', discount_type: 'percentage', discount_value: 20, usage_count: 0, usage_limit: 1, status: 'active' });
    const couponResults = await Promise.allSettled([buyer, secondBuyer].map((customer, index) => commerceRpc({ db, client, user: customer }, 'create_order_v2', {
      ...retry, _buyer_id: customer.id, _request_id: 'coupon-race-' + index, _total_amount: 8, _coupon_code: 'LASTUSE',
    })));
    assert.equal(couponResults.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal((await db.collection('coupons').findOne({ id: 'limited' })).usage_count, 1);
    assert.equal((await db.collection('products').findOne({ id: 'p' })).stock, 3);
  } finally {
    try { await db.dropDatabase(); } finally { await client.close(); }
  }
});
