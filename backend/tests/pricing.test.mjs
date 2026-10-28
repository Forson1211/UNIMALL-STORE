import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.mjs';
import { quoteCart, lineCents } from '../pricing.mjs';
import { commerceRpc } from '../commerce.mjs';

const buyer = { id: 'buyer', role: 'buyer' };
const seller = { id: 'seller', role: 'vendor', vendor_status: 'approved' };
const other = { id: 'other', role: 'vendor', vendor_status: 'approved' };
const admin = { id: 'admin', role: 'admin' };
const items = [{ id: 'a', quantity: 3 }, { id: 'b', quantity: 1 }];
function setup() {
  return fixture({ users: [buyer, seller, other, admin], products: [
    { id: 'a', name: 'Notebook', price: 10, stock: 20, is_active: true, vendor_id: seller.id },
    { id: 'b', name: 'Pen', price: 5, stock: 20, is_active: true, vendor_id: other.id },
  ], coupons: [{ id: 'c', code: 'STORE10', created_by: seller.id, scope: 'vendor', discount_type: 'percentage', discount_value: 10, usage_count: 0, usage_limit: 1, status: 'active' }] });
}
const shipping = { fullName: 'Campus Buyer', email: 'buyer@test.com', phone: '0241234567', address: 'Campus hostel room 3' };
const order = (quote, request = 'coupon-order') => ({ _buyer_id: buyer.id, _request_id: request, _items: items, _payment_method: 'cod', _shipping_details: shipping, _coupon_code: quote.coupon_code, _total_amount: quote.total });

test('store coupon discounts only its seller and is reserved exactly once on checkout', async () => {
  const f = setup(); const ctx = { ...f, user: buyer };
  const quote = await quoteCart(f.db, items, 'store10');
  assert.equal(quote.subtotal, 35); assert.equal(quote.discount, 3); assert.equal(quote.total, 32);
  assert.equal(quote.items.find(line => line.id === 'b').total, 5);
  const id = await commerceRpc(ctx, 'create_order_v2', order(quote));
  assert.equal(await commerceRpc(ctx, 'create_order_v2', order(quote)), id);
  assert.equal(f.rows('coupons')[0].usage_count, 1);
  assert.equal(f.rows('order_items').reduce((sum, line) => sum + lineCents(line), 0), 3200);
  await assert.rejects(commerceRpc(ctx, 'create_order_v2', order(quote, 'next-coupon-order')), /fully used/);
  assert.equal(f.rows('orders').length, 1);
});

test('platform fixed discount allocates exact cents, capped at the eligible subtotal', async () => {
  const f = setup(); Object.assign(f.rows('coupons')[0], { code: 'PLATFORM', created_by: admin.id, scope: 'platform', discount_type: 'fixed_amount', discount_value: 0.01 });
  const quote = await quoteCart(f.db, items, 'PLATFORM');
  assert.equal(quote.total, 34.99);
  assert.equal(quote.items.reduce((sum, line) => sum + Math.round(line.total * 100), 0), 3499);
  f.rows('coupons')[0].discount_value = 100;
  assert.equal((await quoteCart(f.db, items, 'PLATFORM')).total, 0);
});

test('only current approved deals price checkout; expired, rejected and foreign deals cannot', async () => {
  const f = setup(); const deal = { id: 'd', product_id: 'a', vendor_id: seller.id, discount_price: 8, approved_by_admin: true, rejected_at: null, start_time: '2020-01-01T00:00:00.000Z', end_time: '2099-01-01T00:00:00.000Z' };
  f.rows('deals').push(structuredClone(deal));
  const quote = await quoteCart(f.db, items, 'STORE10');
  assert.equal(quote.subtotal, 29); assert.equal(quote.discount, 2.4); assert.equal(quote.total, 26.6);
  for (const change of [{ approved_by_admin: false }, { rejected_at: '2026-01-01' }, { vendor_id: other.id }, { end_time: '2020-01-02T00:00:00.000Z' }]) {
    Object.assign(f.rows('deals')[0], deal, change);
    assert.equal((await quoteCart(f.db, items)).total, 35);
  }
});

test('invalid coupons, wrong-store codes and stale totals never consume stock or coupon uses', async () => {
  for (const change of [{ status: 'disabled' }, { start_date: '2099-01-01' }, { end_date: '2000-01-01' }, { usage_count: 1 }]) {
    const f = setup(); Object.assign(f.rows('coupons')[0], change);
    await assert.rejects(quoteCart(f.db, items, 'STORE10'));
  }
  const f = setup();
  await assert.rejects(quoteCart(f.db, [{ id: 'b', quantity: 1 }], 'STORE10'), /only to products/);
  const quote = await quoteCart(f.db, items, 'STORE10');
  await assert.rejects(commerceRpc({ ...f, user: buyer }, 'create_order_v2', { ...order(quote), _total_amount: 1 }), { status: 409 });
  assert.equal(f.rows('products')[0].stock, 20); assert.equal(f.rows('coupons')[0].usage_count, 0);
});

test('buyer cancellation is account-owned, adjusts discounted totals and restores stock once', async () => {
  const f = setup(); const ctx = { ...f, user: buyer };
  const quote = await quoteCart(f.db, items, 'STORE10');
  const id = await commerceRpc(ctx, 'create_order_v2', order(quote));
  await assert.rejects(commerceRpc({ ...f, user: other }, 'cancel_buyer_order', { _order_id: id }), { status: 404 });
  for (let i = 0; i < 2; i++) await commerceRpc(ctx, 'cancel_buyer_order', { _order_id: id });
  assert.equal(f.rows('orders')[0].total_amount, 0);
  assert.deepEqual(f.rows('products').map(product => product.stock), [20, 20]);
  assert.equal(f.rows('coupons')[0].usage_count, 1);
});

test('dispatched orders cannot be cancelled by the buyer', async () => {
  const f = setup(); const ctx = { ...f, user: buyer }; const quote = await quoteCart(f.db, items);
  const id = await commerceRpc(ctx, 'create_order_v2', order(quote));
  for (const status of ['confirmed', 'shipped']) await commerceRpc({ ...f, user: seller }, 'update_order_fulfillment', { _order_id: id, _new_status: status });
  await assert.rejects(commerceRpc(ctx, 'cancel_buyer_order', { _order_id: id }), { status: 409 });
  assert.equal(f.rows('products')[0].stock, 17);
});

test('vendor payouts use exact discounted line totals rather than gross unit prices', async () => {
  const f = setup();
  Object.assign(f.rows('coupons')[0], { code: 'PENNY', scope: 'platform', created_by: admin.id, discount_type: 'fixed_amount', discount_value: 0.01 });
  f.rows('vendor_payment_methods').push({ id: 'method', vendor_id: seller.id, type: 'momo', label: 'Store account', details: { accountNumber: '0241234567' } });
  const quote = await quoteCart(f.db, items, 'PENNY');
  const id = await commerceRpc({ ...f, user: buyer }, 'create_order_v2', order(quote));
  for (const actor of [seller, other]) for (const status of ['confirmed', 'shipped', 'delivered']) await commerceRpc({ ...f, user: actor }, 'update_order_fulfillment', { _order_id: id, _new_status: status });
  await commerceRpc({ ...f, user: admin }, 'mark_order_collected', { _order_id: id });
  await assert.rejects(commerceRpc({ ...f, user: seller }, 'request_vendor_payout', { _amount: 30, _payment_method_id: 'method' }), { status: 409 });
  await commerceRpc({ ...f, user: seller }, 'request_vendor_payout', { _amount: 29.99, _payment_method_id: 'method' });
  assert.equal(f.rows('payout_requests')[0].amount, 29.99);
});
