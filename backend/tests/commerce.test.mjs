import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commerceRpc } from '../commerce.mjs';
import { fixture } from './fixtures.mjs';

const buyer = { id: 'buyer', role: 'buyer' };
const seller = { id: 'seller', role: 'vendor', vendor_status: 'approved' };
const staff = { id: 'staff', role: 'order_manager' };
function setup() {
  return fixture({ users: [buyer, seller, staff, { id: 'other', role: 'vendor', vendor_status: 'approved' }],
    products: [{ id: 'p', vendor_id: seller.id, name: 'Campus book', price: 10.01, stock: 4, is_active: true }],
    vendor_payment_methods: [{ id: 'm', vendor_id: seller.id, type: 'momo', label: 'My account', details: { accountNumber: '0240000000' } }] });
}
const params = () => ({ _buyer_id: buyer.id, _request_id: 'request-123', _payment_method: 'cod', _total_amount: 20.02,
  _items: [{ id: 'p', quantity: 2, price: 0.01, vendor_id: 'forged' }],
  _shipping_details: { fullName: 'Campus Buyer', email: 'buyer@example.com', phone: '0240000000', address: 'Campus hostel room 4' } });
test('checkout uses stored price and ownership, reserves stock once, and reuses request IDs', async () => {
  const f = setup(); const ctx = { ...f, user: buyer };
  const id = await commerceRpc(ctx, 'create_order_v2', params());
  assert.equal(await commerceRpc(ctx, 'create_order_v2', params()), id);
  assert.equal(f.rows('orders').length, 1);
  assert.equal(f.rows('products')[0].stock, 2);
  assert.equal(f.rows('orders')[0].total_amount, 20.02);
  assert.equal(f.rows('order_items')[0].vendor_id, seller.id);
  assert.equal(f.rows('order_items')[0].price_at_purchase, 10.01);
});
test('checkout rejects forged buyers, changed totals, unavailable stock and malformed lines', async () => {
  for (const override of [{ _buyer_id: 'other' }, { _total_amount: 0.02 }, { _items: [{ id: 'p', quantity: 5 }] }, { _items: [null] }]) {
    const f = setup();
    await assert.rejects(commerceRpc({ ...f, user: buyer }, 'create_order_v2', { ...params(), ...override }));
    assert.equal(f.rows('orders').length, 0);
    assert.equal(f.rows('products')[0].stock, 4);
  }
});
test('fulfillment enforces seller ownership and restores cancelled stock only once', async () => {
  const f = setup();
  const id = await commerceRpc({ ...f, user: buyer }, 'create_order_v2', params());
  await assert.rejects(commerceRpc({ ...f, user: { id: 'other', role: 'vendor', vendor_status: 'approved' } }, 'update_order_fulfillment', { _order_id: id, _new_status: 'confirmed' }), { status: 403 });
  await assert.rejects(commerceRpc({ ...f, user: seller }, 'update_order_fulfillment', { _order_id: id, _new_status: 'delivered' }), { status: 409 });
  for (let i = 0; i < 2; i++) await commerceRpc({ ...f, user: seller }, 'update_order_fulfillment', { _order_id: id, _new_status: 'cancelled' });
  assert.equal(f.rows('products')[0].stock, 4);
  assert.equal(f.rows('orders')[0].status, 'cancelled');
  assert.equal(f.rows('orders')[0].total_amount, 0);
});
test('only delivered collected earnings can be reserved and payouts cannot be settled twice', async () => {
  const f = setup();
  const id = await commerceRpc({ ...f, user: buyer }, 'create_order_v2', params());
  const payoutParams = { _amount: 20.02, _payment_method_id: 'm' };
  await assert.rejects(commerceRpc({ ...f, user: seller }, 'request_vendor_payout', payoutParams), { status: 409 });
  for (const status of ['confirmed', 'shipped', 'delivered']) await commerceRpc({ ...f, user: seller }, 'update_order_fulfillment', { _order_id: id, _new_status: status });
  await assert.rejects(commerceRpc({ ...f, user: seller }, 'mark_order_collected', { _order_id: id }), { status: 403 });
  await assert.rejects(commerceRpc({ ...f, user: seller }, 'request_vendor_payout', payoutParams), { status: 409 });
  await commerceRpc({ ...f, user: staff }, 'mark_order_collected', { _order_id: id });
  const payout = await commerceRpc({ ...f, user: seller }, 'request_vendor_payout', payoutParams);
  await assert.rejects(commerceRpc({ ...f, user: seller }, 'request_vendor_payout', { ...payoutParams, _amount: 10 }), { status: 409 });
  for (const status of ['approved', 'paid', 'paid']) await commerceRpc({ ...f, user: staff }, 'approve_payout_request', { _payout_id: payout, _new_status: status });
  assert.equal(f.rows('transactions').filter(t => t.type === 'withdrawal').length, 1);
});
test('deactivation disables login access and preserves the last active administrator', async () => {
  const admin = { id: 'admin', role: 'admin' };
  const f = fixture({ users: [admin, buyer], sessions: [{ id: 'session', user_id: buyer.id }] });
  await commerceRpc({ ...f, user: admin }, 'admin_deactivate_user', { _target_user_id: buyer.id });
  assert.equal(f.rows('users').find(u => u.id === buyer.id).disabled, true);
  assert.equal(f.rows('sessions').length, 0);
  await assert.rejects(commerceRpc({ ...f, user: admin }, 'admin_deactivate_user', { _target_user_id: admin.id }), { status: 409 });
});

test('assigning the current role preserves approval and active sessions', async () => {
  const admin = { id: 'admin', role: 'admin' };
  const f = fixture({ users: [admin, seller], sessions: [{ id: 'seller-session', user_id: seller.id }] });
  await commerceRpc({ ...f, user: admin }, 'admin_assign_role', { _target_user_id: seller.id, _new_role: 'vendor' });
  assert.equal(f.rows('users').find(user => user.id === seller.id).vendor_status, 'approved');
  assert.equal(f.rows('sessions').length, 1);
});
