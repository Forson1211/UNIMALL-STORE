import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commerceAnalytics } from '../analytics.mjs';
import { configuration } from '../config.mjs';
import { connectDatabase } from '../db.mjs';

test('analytics rejects guests, pending sellers, unrelated staff and invalid periods before reading data', async () => {
  const unavailable = { collection() { throw new Error('Unauthorized database access'); } };
  for (const [user, scope, status] of [[null, 'vendor', 401], [{ id: 'buyer', role: 'buyer' }, 'vendor', 403], [{ id: 'seller', role: 'vendor', vendor_status: 'pending' }, 'vendor', 403], [{ id: 'seller', role: 'vendor', vendor_status: 'approved' }, 'admin', 403], [{ id: 'content', role: 'content_manager' }, 'admin', 403]]) {
    await assert.rejects(commerceAnalytics(unavailable, user, scope), error => error.status === status);
  }
  await assert.rejects(commerceAnalytics(unavailable, { id: 'admin', role: 'admin' }, 'admin', { days: 999 }), error => error.status === 400);
});

test('Atlas analytics handles more than 500 orders, discounted mixed stores, cancellation and private seller scope', { skip: !process.env.TEST_MONGODB_URI, timeout: 120000 }, async () => {
  const database = 'analytics_test_' + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
  const connection = await connectDatabase({ ...configuration(), uri: process.env.TEST_MONGODB_URI, database });
  const { db } = connection;
  const now = new Date('2026-10-27T12:00:00Z'), created_at = '2026-10-27T08:00:00Z';
  const seller = { id: 'seller-a', role: 'vendor', vendor_status: 'approved' };
  try {
    await db.collection('users').insertMany([{ ...seller, email: 'seller-a@analytics.test' }, { id: 'seller-b', email: 'seller-b@analytics.test', role: 'vendor', vendor_status: 'approved' }]);
    await db.collection('products').insertMany([
      { id: 'a', vendor_id: seller.id, name: 'Campus notebook', category: 'Books', stock: 5, is_active: true },
      { id: 'b', vendor_id: 'seller-b', name: 'Headphones', category: 'Electronics', stock: 2, is_active: true },
      { id: 'removed', vendor_id: seller.id, name: 'Removed listing', stock: 5, is_active: false, description: '<!-- UNIMALL_META:{"status":"deleted_by_admin"} -->' },
    ]);
    const orders = Array.from({ length: 501 }, (_, index) => ({ id: 'order-' + index, created_at, status: 'delivered', payment_status: 'paid', total_amount: 1, buyer_id: 'private-buyer' }));
    const lines = orders.map(order => ({ id: 'line-' + order.id, order_id: order.id, vendor_id: seller.id, product_id: 'a', quantity: 1, price_at_purchase: 2, total_price: 1, fulfillment_status: 'delivered' }));
    orders.push({ id: 'mixed', created_at, status: 'shipped', payment_status: 'paid', total_amount: 48, buyer_email: 'private-buyer@example.com' },
      { id: 'other', created_at, status: 'delivered', payment_status: 'completed', total_amount: 7 },
      { id: 'pending', created_at, status: 'pending', payment_status: 'pending', total_amount: 20 },
      { id: 'cancelled', created_at, status: 'cancelled', payment_status: 'pending', total_amount: 0 },
      { id: 'old', created_at: '2026-10-20T23:59:59Z', status: 'delivered', payment_status: 'paid', total_amount: 100 });
    lines.push({ id: 'mixed-a', order_id: 'mixed', vendor_id: seller.id, product_id: 'a', quantity: 2, price_at_purchase: 10, total_price: 18, fulfillment_status: 'delivered' },
      { id: 'mixed-b', order_id: 'mixed', vendor_id: 'seller-b', product_id: 'b', quantity: 3, price_at_purchase: 10, total_price: 30, fulfillment_status: 'shipped' },
      { id: 'mixed-cancelled', order_id: 'mixed', vendor_id: seller.id, product_id: 'a', quantity: 1, price_at_purchase: 10, total_price: 10, fulfillment_status: 'cancelled' },
      { id: 'other', order_id: 'other', vendor_id: 'seller-b', product_id: 'b', quantity: 1, price_at_purchase: 7, fulfillment_status: 'delivered' },
      { id: 'pending', order_id: 'pending', vendor_id: seller.id, product_id: 'a', quantity: 2, price_at_purchase: 10, fulfillment_status: 'pending' },
      { id: 'cancelled', order_id: 'cancelled', vendor_id: seller.id, product_id: 'a', quantity: 2, price_at_purchase: 10, fulfillment_status: 'cancelled' },
      { id: 'old', order_id: 'old', vendor_id: seller.id, product_id: 'a', quantity: 10, price_at_purchase: 10, fulfillment_status: 'delivered' });
    await db.collection('orders').insertMany(orders.map(order => ({ ...order, buyer_id: 'private-buyer', checkout_request_id: order.id }))); await db.collection('order_items').insertMany(lines);
    const own = await commerceAnalytics(db, seller, 'vendor', { days: 7, vendor_id: 'seller-b' }, now);
    assert.equal(own.start, '2026-10-21'); assert.equal(own.end, '2026-10-27');
    assert.equal(own.totals.orders, 504); assert.equal(own.totals.collected, 502); assert.equal(own.totals.revenue, 519);
    assert.equal(own.catalog.total, 1); assert.equal(own.catalog.published, 1);
    assert.deepEqual(own.categories, [{ name: 'Books', value: 519 }]);
    assert.equal(own.products[0].units, 503); assert.equal(own.products[0].value, 519);
    assert.equal(JSON.stringify(own).includes('private-buyer'), false);
    assert.equal(own.daily.reduce((sum, day) => sum + day.revenue, 0), own.totals.revenue);
    assert.deepEqual(own.hourly, [{ weekday: 1, hour: 8, orders: 504, revenue: 519 }]);
    const marketplace = await commerceAnalytics(db, { id: 'admin', role: 'admin' }, 'admin', { days: 7 }, now);
    assert.equal(marketplace.totals.revenue, 508); assert.equal(marketplace.totals.orders, 505);
    assert.equal(marketplace.categories.reduce((sum, category) => sum + category.value, 0), 508);
    assert.deepEqual(marketplace.vendors, { total: 2, approved: 2 });
    const other = await commerceAnalytics(db, { id: 'seller-b', role: 'vendor', vendor_status: 'approved' }, 'vendor', { days: 7 }, now);
    assert.equal(other.totals.revenue, 7); assert.deepEqual(other.categories, [{ name: 'Electronics', value: 7 }]);
    console.log('Analytics: exact net totals, 500+ orders, seller isolation, partial cancellation, date boundaries and no buyer data passed.');
  } finally {
    assert.match(connection.db.databaseName, /^analytics_test_[a-f0-9]{16}$/);
    try { await connection.db.dropDatabase(); } finally { await connection.client.close(); }
  }
});
