import { transact } from './db.mjs';
import { approved, cents, fail, hasRole, identity, staff, text, timestamp } from './security.mjs';
import { lineCents, quoteCart } from './pricing.mjs';

export const ORDER_STAFF = ['order_manager'];
export const VENDOR_STAFF = ['vendor_manager'];
export const aggregateStatus = statuses => {
  if (statuses.every(s => s === 'cancelled')) return 'cancelled';
  if (statuses.includes('pending')) return 'pending';
  if (statuses.some(s => ['confirmed', 'processing'].includes(s))) return 'confirmed';
  if (statuses.includes('shipped')) return 'shipped';
  return 'delivered';
};
export async function audit(db, session, user, message, metadata = {}) {
  await db.collection('system_logs').insertOne({ id: crypto.randomUUID(), user_id: user.id, type: 'security', source: 'marketplace', message, metadata, created_at: timestamp() }, { session });
}
export async function notify(db, session, userId, preference, title, message, link, type = 'info') {
  const profile = await db.collection('profiles').findOne({ user_id: userId }, { session });
  if (profile?.notification_preferences?.[preference] === false) return;
  await db.collection('notifications').insertOne({ id: crypto.randomUUID(), user_id: userId, title, message, link, type, read: false, created_at: timestamp() }, { session });
}
export async function lockAccount(db, session, userId) {
  const user = await db.collection('users').findOneAndUpdate({ id: userId, disabled: { $ne: true } }, { $inc: { commerce_version: 1 } }, { session, returnDocument: 'after' });
  if (!user) fail(403, 'This account is unavailable.');
  return user;
}

async function checkout(ctx, params) {
  const { db, client, user } = ctx;
  const buyerId = identity(user);
  if (params._buyer_id !== buyerId) fail(403, 'The buyer must match the signed-in account.');
  const requestId = text(params._request_id, 'checkout request ID', 8, 128);
  return transact(client, async session => {
    await lockAccount(db, session, buyerId);
    const previous = await db.collection('orders').findOne({ buyer_id: buyerId, checkout_request_id: requestId }, { session });
    if (previous) return previous.id;
    if (params._payment_method !== 'cod') fail(400, 'Only cash on delivery is currently supported.');
    const shipping = params._shipping_details || {};
    const details = { fullName: text(shipping.fullName, 'full name', 2, 120), email: text(shipping.email, 'email address', 3, 254),
      phone: text(shipping.phone, 'phone number', 9, 30), address: text(shipping.address, 'delivery address', 4, 1000), digitalAddress: typeof shipping.digitalAddress === 'string' ? shipping.digitalAddress.slice(0, 100) : '' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) fail(400, 'Enter a valid contact email.');
    const quote = await quoteCart(db, params._items, params._coupon_code, session);
    const items = quote.items;
    for (const sellerId of [...new Set(items.map(item => item.vendor_id))].sort()) {
      if (!approved(await lockAccount(db, session, sellerId))) fail(409, 'A store is no longer available. Refresh your cart.');
    }
    const snapshots = [];
    let total = 0;
    for (const item of [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
      if (typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) fail(400, 'Invalid product quantity.');
      const product = { id: item.id, vendor_id: item.vendor_id, name: item.name, image_url: item.image, stock: item.stock };
      const unit = cents(item.price);
      if (unit <= 0 || product.stock < item.quantity) fail(409, `Not enough available stock for ${product.name}.`);
      const result = await db.collection('products').updateOne({ id: product.id, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity }, $set: { updated_at: timestamp() } }, { session });
      if (!result.modifiedCount) fail(409, 'Stock changed. Refresh your cart and retry.');
      total += cents(item.total);
      snapshots.push({ id: crypto.randomUUID(), product_id: product.id, vendor_id: product.vendor_id, quantity: item.quantity,
        price_at_purchase: unit / 100, unit_price: unit / 100,
        discount_amount: item.discount, total_price: item.total,
        product_name: product.name, product_image: product.image_url, fulfillment_status: 'pending', created_at: timestamp() });
      if (product.stock > 3 && product.stock - item.quantity <= 3) await notify(db, session, product.vendor_id, 'low_stock', 'Low Stock', `${product.name} is running low.`, '/vendor/products', 'warning');
    }
    if (cents(params._total_amount) !== total) fail(409, 'Prices have changed. Refresh your cart before ordering.');
    if (quote.coupon_id) {
      // All orders using a code write the same document, so transaction retries enforce its usage limit.
      const result = await db.collection('coupons').updateOne({ id: quote.coupon_id, status: 'active' }, { $inc: { usage_count: 1 } }, { session });
      if (!result.matchedCount) fail(409, 'This coupon is no longer available.');
    }
    const id = crypto.randomUUID();
    await db.collection('orders').insertOne({ id, buyer_id: buyerId, checkout_request_id: requestId, total_amount: total / 100,
      subtotal: quote.subtotal, discount_amount: quote.discount, coupon_code: quote.coupon_code,
      status: 'pending', shipping_address: details.address, shipping_details: details, payment_method: 'cod', payment_status: 'pending', created_at: timestamp() }, { session });
    await db.collection('order_items').insertMany(snapshots.map(item => ({ ...item, order_id: id })), { session });
    await db.collection('transactions').insertOne({ id: crypto.randomUUID(), user_id: buyerId, amount: total / 100, currency: 'GHS', type: 'payment', status: 'pending', payment_method: 'cod', reference_id: id, created_at: timestamp() }, { session });
    for (const sellerId of new Set(snapshots.map(item => item.vendor_id))) await notify(db, session, sellerId, 'new_order', 'New Order Received', 'You have a new order for your items.', '/vendor/orders', 'success');
    return id;
  });
}

async function fulfill(ctx, params, buyerCancellation = false) {
  const { db, client, user } = ctx;
  identity(user);
  const newStatus = buyerCancellation ? 'cancelled' : params._new_status;
  if (!['confirmed', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) fail(400, 'Invalid fulfillment status.');
  return transact(client, async session => {
    const actor = await lockAccount(db, session, user.id);
    const order = await db.collection('orders').findOne({ id: params._order_id }, { session });
    if (!order) fail(404, 'Order not found.');
    const all = await db.collection('order_items').find({ order_id: order.id }, { session }).toArray();
    if (buyerCancellation) {
      if (order.buyer_id !== actor.id) fail(404, 'Order not found in your account.');
      if (all.length && all.every(line => line.fulfillment_status === 'cancelled')) return true;
      if (order.payment_status !== 'pending' || all.some(line => !['pending', 'confirmed', 'processing', 'cancelled'].includes(line.fulfillment_status))) fail(409, 'This order has already been dispatched or paid. Contact support for help.');
    }
    const isStaff = hasRole(actor, 'admin', ...ORDER_STAFF);
    const lines = all.filter(line => buyerCancellation || isStaff || (approved(actor) && line.vendor_id === actor.id));
    if (!lines.length) fail(403, 'You cannot manage this order.');
    if (newStatus !== 'cancelled' && lines.every(line => line.fulfillment_status === 'cancelled')) fail(409, 'Cancelled items cannot be fulfilled.');
    for (const line of lines) {
      const old = line.fulfillment_status;
      if (old === newStatus || old === 'cancelled') continue;
      const allowed = (newStatus === 'confirmed' && old === 'pending') || (newStatus === 'shipped' && ['confirmed', 'processing'].includes(old)) ||
        (newStatus === 'delivered' && old === 'shipped') || (newStatus === 'cancelled' && ['pending', 'confirmed', 'processing'].includes(old) && order.payment_status === 'pending');
      if (!allowed) fail(409, 'This fulfillment transition is not allowed.');
      if (newStatus === 'cancelled') await db.collection('products').updateOne({ id: line.product_id }, { $inc: { stock: line.quantity } }, { session });
      await db.collection('order_items').updateOne({ id: line.id }, { $set: { fulfillment_status: newStatus } }, { session });
      line.fulfillment_status = newStatus;
    }
    const status = aggregateStatus(all.map(line => line.fulfillment_status));
    const total = all.filter(line => line.fulfillment_status !== 'cancelled').reduce((sum, line) => sum + lineCents(line), 0) / 100;
    await db.collection('orders').updateOne({ id: order.id }, { $set: { status, total_amount: total, updated_at: timestamp() } }, { session });
    await db.collection('transactions').updateMany({ reference_id: order.id, type: 'payment', status: 'pending' }, { $set: { amount: total, ...(status === 'cancelled' ? { status: 'failed' } : {}) } }, { session });
    if (buyerCancellation) {
      for (const vendorId of new Set(all.map(line => line.vendor_id))) await notify(db, session, vendorId, 'new_order', 'Order cancelled', 'The buyer cancelled an order before dispatch. Reserved stock has been restored.', '/vendor/orders', 'warning');
    } else await notify(db, session, order.buyer_id, 'order_updates', 'Order updated', `Your order is now ${status}.`, '/account/orders?order=' + order.id);
    return true;
  });
}

async function requestPayout(ctx, params) {
  const { db, client, user } = ctx;
  identity(user);
  const amount = cents(params._amount);
  if (amount < 1000) fail(400, 'Minimum payout is GHS 10.');
  return transact(client, async session => {
    const actor = await lockAccount(db, session, user.id);
    if (!hasRole(actor, 'vendor', 'admin') || !approved(actor)) fail(403, 'Only approved sellers can request payouts.');
    const method = await db.collection('vendor_payment_methods').findOne({ id: params._payment_method_id, vendor_id: actor.id }, { session });
    if (!method) fail(400, 'Choose your own payout destination.');
    const lines = await db.collection('order_items').find({ vendor_id: actor.id, fulfillment_status: 'delivered' }, { session }).toArray();
    const paidOrders = await db.collection('orders').find({ id: { $in: lines.map(i => i.order_id) }, status: 'delivered', payment_status: { $in: ['paid', 'completed'] } }, { session }).toArray();
    const paidIds = new Set(paidOrders.map(o => o.id));
    const earned = lines.filter(i => paidIds.has(i.order_id)).reduce((sum, i) => sum + lineCents(i), 0);
    const payouts = await db.collection('payout_requests').find({ vendor_id: actor.id, status: { $in: ['pending', 'approved', 'paid'] } }, { session }).toArray();
    const reserved = payouts.reduce((sum, p) => sum + cents(p.amount), 0);
    if (amount > earned - reserved) fail(409, 'Insufficient collected earnings for this payout.');
    const id = crypto.randomUUID();
    await db.collection('payout_requests').insertOne({ id, vendor_id: actor.id, amount: amount / 100, status: 'pending', payment_method: method.type, payment_details: method.details, payment_label: method.label, requested_at: timestamp() }, { session });
    return id;
  });
}

export async function commerceRpc(ctx, name, params) {
  const { db, client, user } = ctx;
  if (name === 'quote_checkout') return quoteCart(db, params._items, params._coupon_code);
  if (['get_user_role', 'get_user_role_text', 'get_vendor_status'].includes(name)) {
    identity(user);
    if (params._user_id !== user.id) fail(403, 'Account permissions are private.');
    return name === 'get_vendor_status' ? user.vendor_status : user.role;
  }
  if (['create_order_v2', 'create_order_secure'].includes(name)) return checkout(ctx, { ...params, _request_id: params._request_id || (name === 'create_order_secure' ? crypto.randomUUID() : undefined) });
  if (name === 'update_order_fulfillment') return fulfill(ctx, params);
  if (name === 'cancel_buyer_order') return fulfill(ctx, params, true);
  if (name === 'request_vendor_payout') return requestPayout(ctx, params);
  if (name === 'mark_order_collected') {
    staff(user, ...ORDER_STAFF);
    return transact(client, async session => {
      const actor = await lockAccount(db, session, user.id); staff(actor, ...ORDER_STAFF);
      const order = await db.collection('orders').findOne({ id: params._order_id }, { session });
      if (!order || order.status !== 'delivered' || order.payment_method !== 'cod') fail(409, 'Only delivered cash-on-delivery orders can be marked collected.');
      if (['paid', 'completed'].includes(order.payment_status)) return true;
      await db.collection('orders').updateOne({ id: order.id }, { $set: { payment_status: 'paid' } }, { session });
      await db.collection('transactions').updateMany({ reference_id: order.id, type: 'payment', status: 'pending' }, { $set: { status: 'completed' } }, { session });
      await audit(db, session, user, 'Cash collection recorded', { order_id: order.id });
      return true;
    });
  }
  if (name === 'approve_payout_request') {
    staff(user, ...ORDER_STAFF);
    return transact(client, async session => {
      const actor = await lockAccount(db, session, user.id); staff(actor, ...ORDER_STAFF);
      const payout = await db.collection('payout_requests').findOne({ id: params._payout_id }, { session });
      if (!payout) fail(404, 'Payout not found.');
      const next = params._new_status;
      if (next === payout.status) return true;
      if (!((next === 'approved' && payout.status === 'pending') || (next === 'rejected' && ['pending', 'approved'].includes(payout.status)) || (next === 'paid' && payout.status === 'approved'))) fail(409, 'Invalid payout transition.');
      await db.collection('payout_requests').updateOne({ id: payout.id }, { $set: { status: next, processed_at: timestamp() } }, { session });
      if (next === 'paid') await db.collection('transactions').insertOne({ id: crypto.randomUUID(), user_id: payout.vendor_id, amount: payout.amount, currency: 'GHS', type: 'withdrawal', status: 'completed', payment_method: payout.payment_method, reference_id: payout.id, created_at: timestamp() }, { session });
      await audit(db, session, user, 'Payout status updated', { payout_id: payout.id, status: next });
      return true;
    });
  }
  if (name === 'reply_to_vendor_review') {
    identity(user);
    const reply = text(params._reply, 'reply', 1, 5000);
    return transact(client, async session => {
      const actor = await lockAccount(db, session, user.id);
      if (!approved(actor)) fail(403, 'Only approved sellers can reply.');
      const review = await db.collection('reviews').findOne({ id: params._review_id }, { session });
      if (!review || !await db.collection('products').findOne({ id: review.product_id, vendor_id: actor.id }, { session })) fail(404, 'Review not found for your store.');
      await db.collection('reviews').updateOne({ id: review.id }, { $set: { vendor_reply: reply, vendor_reply_at: timestamp() } }, { session });
      return true;
    });
  }
  if (name === 'set_vendor_verification') {
    staff(user, ...VENDOR_STAFF);
    if (typeof params._verified !== 'boolean') fail(400, 'Choose a valid verification state.');
    return transact(client, async session => {
      const actor = await lockAccount(db, session, user.id); staff(actor, ...VENDOR_STAFF);
      const vendor = await lockAccount(db, session, params._vendor_id);
      if (vendor.role !== 'vendor' || (params._verified && vendor.vendor_status !== 'approved')) fail(409, 'Approve the vendor before awarding verification.');
      const result = await db.collection('profiles').updateOne({ user_id: vendor.id }, { $set: { verified: params._verified, updated_at: timestamp() } }, { session });
      if (!result.matchedCount) fail(404, 'Vendor profile not found.');
      await audit(db, session, actor, 'Vendor verification updated', { vendor_id: vendor.id, verified: params._verified });
      return true;
    });
  }
  if (['update_vendor_status', 'admin_approve_vendor'].includes(name)) {
    staff(user, ...VENDOR_STAFF);
    const status = name === 'admin_approve_vendor' ? 'approved' : params._new_status;
    if (!['pending', 'approved', 'suspended'].includes(status)) fail(400, 'Invalid vendor status.');
    return transact(client, async session => {
      const actor = await lockAccount(db, session, user.id); staff(actor, ...VENDOR_STAFF);
      const previous = await db.collection('users').findOne({ id: params._vendor_id, role: 'vendor', disabled: { $ne: true } }, { session });
      if (!previous) fail(404, 'Vendor not found.');
      if (previous.vendor_status === status) return true;
      const result = await db.collection('users').updateOne({ id: params._vendor_id, role: 'vendor', disabled: { $ne: true } }, { $set: { vendor_status: status } }, { session });
      if (!result.matchedCount) fail(404, 'Vendor not found.');
      if (status !== 'approved') await db.collection('profiles').updateOne({ user_id: params._vendor_id }, { $set: { verified: false } }, { session });
      await notify(db, session, params._vendor_id, 'account_status', status === 'approved' ? 'Store approved' : status === 'suspended' ? 'Store suspended' : 'Store under review',
        status === 'approved' ? 'Your store can now publish products after completing its profile.' : 'Your store is unavailable to new buyers. Contact support for details.', '/vendor', status === 'approved' ? 'success' : 'warning');
      await audit(db, session, user, 'Vendor status updated', { vendor_id: params._vendor_id, status });
      return true;
    });
  }
  if (['admin_assign_role', 'admin_deactivate_user', 'delete_vendor_account'].includes(name)) {
    staff(user);
    const targetId = params._target_user_id || params._vendor_id;
    const nextRole = name === 'admin_assign_role' ? params._new_role : 'buyer';
    if (!['admin', 'moderator', 'vendor_manager', 'order_manager', 'content_manager', 'support_agent', 'vendor', 'buyer'].includes(nextRole)) fail(400, 'Invalid role.');
    return transact(client, async session => {
      await db.collection('revisions').updateOne({ _id: 'role_changes' }, { $inc: { version: 1 } }, { session, upsert: true });
      const actor = await db.collection('users').findOne({ id: user.id }, { session }); staff(actor);
      const target = await db.collection('users').findOne({ id: targetId }, { session });
      if (!target) fail(404, 'Account not found.');
      if (name === 'delete_vendor_account' && target.role !== 'vendor') fail(404, 'Vendor not found.');
      if (name === 'admin_assign_role' && target.role === nextRole) return true;
      if (target.role === 'admin' && nextRole !== 'admin' && await db.collection('users').countDocuments({ role: 'admin', disabled: { $ne: true } }, { session }) <= 1) fail(409, 'Keep at least one active administrator.');
      await db.collection('users').updateOne({ id: targetId }, { $set: { role: nextRole, vendor_status: nextRole === 'vendor' ? 'pending' : null, ...(['delete_vendor_account', 'admin_deactivate_user'].includes(name) ? { disabled: true } : {}) } }, { session });
      if (nextRole !== 'vendor') await db.collection('products').updateMany({ vendor_id: targetId }, { $set: { is_active: false } }, { session });
      await db.collection('sessions').deleteMany({ user_id: targetId }, { session });
      await audit(db, session, user, 'Account role/access updated', { user_id: targetId, role: nextRole, deactivated: ['delete_vendor_account', 'admin_deactivate_user'].includes(name) });
      return true;
    });
  }
  return undefined;
}
