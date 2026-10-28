import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { configuration } from '../config.mjs';
import { connectDatabase } from '../db.mjs';
import { createApp } from '../app.mjs';
import { seedDatabase } from '../seed-data.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const filter = (field, value) => ({ field, op: 'eq', value });

test('vendor lifecycle on an isolated Atlas database', { skip: !process.env.TEST_MONGODB_URI, timeout: 600000 }, async () => {
  const database = 'vendor_test_' + crypto.randomUUID().replaceAll('-', '').slice(0, 20);
  const config = { ...configuration(), uri: process.env.TEST_MONGODB_URI, database, production: false,
    cookieName: 'vendor_acceptance_session', origin: 'http://127.0.0.1:8081', requireEmailVerification: false };
  const connection = await connectDatabase(config);
  let server;
  const password = 'Acceptance-' + crypto.randomUUID();
  try {
    await seedDatabase(connection, { adminEmail: 'admin@vendor.test', adminPassword: password });
    server = createApp({ ...connection, config, sendMail: async () => {} }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const apiUrl = 'http://127.0.0.1:' + server.address().port + '/api';
    if (process.env.VENDOR_BROWSER_ONLY === 'true') {
      const { verifyVendorBrowser } = await import('../vendor-browser.mjs');
      await verifyVendorBrowser({ connection, config, apiUrl, password, png });
      return;
    }
    function actor() {
      let cookie;
      return {
        user: null,
        async call(path, body, expected = 200, form) {
          const response = await fetch(apiUrl + path, { method: body !== undefined || form ? 'POST' : 'GET',
            headers: { Origin: config.origin, ...(form ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}) },
            body: form || (body === undefined ? undefined : JSON.stringify(body)), signal: AbortSignal.timeout(20000) });
          const data = await response.json();
          assert.equal(response.status, expected, path + ': ' + (data.error?.message || 'unexpected status'));
          if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
          return data;
        },
        async login(email) { const result = await this.call('/auth/login', { email, password }); this.user = result.user; return result; },
        async signup(email, role, storeName) {
          return this.call('/auth/signup', { email, password, options: { data: { full_name: storeName || 'Acceptance Buyer', role, store_name: storeName, vendor_status: 'approved', verified: true } } }, 201);
        },
        async query(table, spec = {}, expected = 200) { return this.call('/query', { table, ...spec }, expected); },
        async action(name, params, expected = 200) { return this.call('/actions/' + name, params, expected); },
        async upload(path, expected = 201) {
          const form = new FormData(); form.append('path', path); form.append('file', new Blob([png], { type: 'image/png' }), 'test.png');
          return this.call('/storage/products', undefined, expected, form);
        },
      };
    }
    const admin = actor(), seller = actor(), second = actor(), buyer = actor(), visitor = actor();
    await admin.login('admin@vendor.test');
    await seller.signup('seller@vendor.test', 'vendor', 'Acceptance Campus Store'); await seller.login('seller@vendor.test');
    await second.signup('second@vendor.test', 'vendor', 'Second Campus Store'); await second.login('second@vendor.test');
    await buyer.signup('buyer@vendor.test', 'buyer'); await buyer.login('buyer@vendor.test');
    await visitor.call('/auth/signup', { email: 'bad@vendor.test', password, options: { data: { full_name: 'Not Admin', role: 'admin' } } }, 400);
    await visitor.call('/auth/signup', { email: 'seller@vendor.test', password, options: { data: { full_name: 'Duplicate', role: 'vendor' } } }, 409);
    assert.equal((await seller.action('get_vendor_status', { _user_id: seller.user.id })).data, 'pending');
    const pending = (await admin.action('list_managed_vendors', {})).data;
    assert.equal(pending.length, 2); assert.ok(pending.every(vendor => vendor.vendor_status === 'pending' && !vendor.verified));
    assert.equal((await admin.query('notifications', { filters: [filter('user_id', admin.user.id)] })).data.length, 2);
    await seller.action('update_vendor_status', { _vendor_id: seller.user.id, _new_status: 'approved' }, 403);
    const listing = { name: 'Campus Notebook', description: 'A listing for acceptance testing', price: 12.5, stock: 5, category: 'Books', image_url: '', is_active: false };
    await seller.query('products', { operation: 'insert', values: listing }, 403);
    await seller.upload(seller.user.id + '/listing.png', 403);
    const imagePath = seller.user.id + '/store/logo.png'; await seller.upload(imagePath);
    await second.upload(imagePath, 403);
    const imageUrl = apiUrl + '/storage/products/file?path=' + encodeURIComponent(imagePath);
    const downloaded = await fetch(imageUrl); assert.equal(downloaded.status, 200); assert.equal(downloaded.headers.get('content-type'), 'image/png');
    const profile = { store_name: 'Acceptance Campus Store', phone: '0241234567', campus: 'University of Ghana', store_description: 'Campus essentials and books', avatar_url: imageUrl, banner_url: imageUrl };
    await seller.query('profiles', { operation: 'update', values: profile, filters: [filter('user_id', seller.user.id)], single: 'one' });
    await seller.query('profiles', { operation: 'update', values: { verified: true }, filters: [filter('user_id', seller.user.id)] }, 403);
    assert.equal((await visitor.query('public_vendor_directory')).data.length, 0);
    await admin.action('update_vendor_status', { _vendor_id: seller.user.id, _new_status: 'approved' });
    await admin.action('update_vendor_status', { _vendor_id: second.user.id, _new_status: 'approved' });
    await second.query('profiles', { operation: 'update', values: { ...profile, store_name: 'Second Campus Store' }, filters: [filter('user_id', second.user.id)], single: 'one' });
    await admin.action('set_vendor_verification', { _vendor_id: seller.user.id, _verified: true });
    console.log('Vendor acceptance: signup, pending profile, GridFS ownership and staff approval passed.');

    const draft = (await seller.query('products', { operation: 'insert', values: listing, single: 'one' })).data;
    assert.equal((await visitor.query('products')).data.length, 0);
    await seller.query('products', { operation: 'update', values: { is_active: true }, filters: [filter('id', draft.id)] }, 400);
    await seller.upload(seller.user.id + '/listing.png');
    await seller.query('products', { operation: 'update', values: { is_active: true, image_url: imageUrl }, filters: [filter('id', draft.id)], single: 'one' });
    await second.query('products', { operation: 'update', values: { price: 1 }, filters: [filter('id', draft.id)], single: 'one' }, 409);
    const other = (await second.query('products', { operation: 'insert', values: { ...listing, name: 'Second Seller Book', price: 8, is_active: true, image_url: imageUrl }, single: 'one' })).data;
    assert.equal((await visitor.query('products')).data.length, 2);
    const order = { _buyer_id: buyer.user.id, _request_id: 'vendor-flow-order', _payment_method: 'cod', _total_amount: 33,
      _items: [{ id: draft.id, quantity: 2, price: 0 }, { id: other.id, quantity: 1, vendor_id: seller.user.id }],
      _shipping_details: { fullName: 'Acceptance Buyer', email: 'buyer@vendor.test', phone: '0241234567', address: 'Campus hostel room 3' } };
    const orderId = (await buyer.action('create_order_v2', order)).data;
    assert.equal((await buyer.action('create_order_v2', order)).data, orderId);
    await seller.query('products', { operation: 'update', values: { stock: 10 }, filters: [filter('id', draft.id), filter('stock', 5)], single: 'one' }, 409);
    const sellerOrders = (await seller.query('vendor_orders_secure')).data;
    assert.equal(sellerOrders.length, 1); assert.equal(sellerOrders[0].vendor_total, 25); assert.equal(sellerOrders[0].order_status, 'pending');
    const ownLines = (await seller.query('order_items', { filters: [filter('order_id', orderId)] })).data;
    assert.equal(ownLines.length, 1); assert.equal(ownLines[0].vendor_id, seller.user.id);
    await second.action('update_order_fulfillment', { _order_id: orderId, _new_status: 'cancelled' });
    await second.action('update_order_fulfillment', { _order_id: orderId, _new_status: 'cancelled' });
    assert.equal((await second.query('products', { filters: [filter('id', other.id)], single: 'one' })).data.stock, 5);
    await second.action('update_order_fulfillment', { _order_id: orderId, _new_status: 'confirmed' }, 409);
    await seller.action('update_order_fulfillment', { _order_id: orderId, _new_status: 'delivered' }, 409);
    for (const status of ['confirmed', 'shipped', 'delivered']) await seller.action('update_order_fulfillment', { _order_id: orderId, _new_status: status });
    const buyerOrder = (await buyer.query('orders', { single: 'one' })).data;
    assert.equal(buyerOrder.status, 'delivered'); assert.equal(buyerOrder.total_amount, 25);
    await seller.action('mark_order_collected', { _order_id: orderId }, 403);
    const method = (await seller.query('vendor_payment_methods', { operation: 'insert', values: { type: 'momo', label: 'Campus Wallet', details: { accountNumber: '0241234567' } }, single: 'one' })).data;
    assert.equal(method.is_default, true);
    await seller.query('vendor_payment_methods', { operation: 'insert', values: { type: 'bank', label: '', details: { accountNumber: '123456789' }, is_default: true } }, 400);
    assert.equal((await seller.query('vendor_payment_methods', { single: 'one' })).data.is_default, true);
    const contact = (await seller.query('vendor_delivery_contacts', { operation: 'insert', values: { name: 'Campus Runner', phone: '0241234567', role: 'Delivery runner' }, single: 'one' })).data;
    assert.equal((await second.query('vendor_delivery_contacts')).data.length, 0);
    await second.query('vendor_delivery_contacts', { operation: 'delete', filters: [filter('id', contact.id)], single: 'one' }, 409);
    assert.equal((await seller.query('vendor_delivery_contacts', { single: 'one' })).data.name, 'Campus Runner');
    await seller.action('request_vendor_payout', { _amount: 25, _payment_method_id: method.id }, 409);
    await admin.action('mark_order_collected', { _order_id: orderId });
    const weekly = (await seller.query('vendor_weekly_sales')).data;
    assert.equal(weekly[0].revenue, 25); assert.equal(weekly[0].orders, 1);
    const alternate = (await seller.query('vendor_payment_methods', { operation: 'insert', values: { type: 'bank', label: 'Campus Bank', details: { accountNumber: '123456789' }, is_default: true }, single: 'one' })).data;
    assert.equal((await seller.query('vendor_payment_methods')).data.filter(row => row.is_default).length, 1);
    await seller.query('vendor_payment_methods', { operation: 'delete', filters: [filter('id', alternate.id)], single: 'one' });
    assert.equal((await seller.query('vendor_payment_methods', { single: 'one' })).data.is_default, true);
    const payout = (await seller.action('request_vendor_payout', { _amount: 25, _payment_method_id: method.id })).data;
    await seller.action('request_vendor_payout', { _amount: 10, _payment_method_id: method.id }, 409);
    for (const status of ['approved', 'paid', 'paid']) await admin.action('approve_payout_request', { _payout_id: payout, _new_status: status });
    assert.equal((await seller.query('transactions', { filters: [filter('type', 'withdrawal')] })).data.length, 1);
    console.log('Vendor acceptance: publishing, stale inventory, mixed-vendor fulfillment, collection and payout reservations passed.');

    const review = (await buyer.query('reviews', { operation: 'insert', values: { product_id: draft.id, rating: 5, comment: 'Helpful campus seller' }, single: 'one' })).data;
    await second.action('reply_to_vendor_review', { _review_id: review.id, _reply: 'Not my product' }, 404);
    await seller.action('reply_to_vendor_review', { _review_id: review.id, _reply: 'Thank you for your order' });
    assert.equal((await visitor.query('reviews')).data.length, 0);
    await admin.query('reviews', { operation: 'update', values: { status: 'approved' }, filters: [filter('id', review.id)] });
    assert.equal((await visitor.query('reviews', { single: 'one' })).data.vendor_reply, 'Thank you for your order');
    const ratedProduct = (await visitor.query('products', { filters: [filter('id', draft.id)], single: 'one' })).data;
    assert.equal(ratedProduct.rating, 5); assert.equal(ratedProduct.reviews_count, 1);
    assert.equal((await visitor.query('public_vendor_directory', { filters: [filter('id', seller.user.id)], single: 'one' })).data.rating, 5);
    await seller.query('profiles', { operation: 'update', values: { notification_preferences: { new_order: false, low_stock: false } }, filters: [filter('user_id', seller.user.id)] });
    const before = (await seller.query('notifications')).data.length;
    await buyer.action('create_order_v2', { ...order, _request_id: 'notifications-off', _total_amount: 12.5, _items: [{ id: draft.id, quantity: 1 }] });
    assert.equal((await seller.query('notifications')).data.length, before);
    await admin.action('update_vendor_status', { _vendor_id: seller.user.id, _new_status: 'suspended' });
    assert.equal((await visitor.query('products', { filters: [filter('vendor_id', seller.user.id)] })).data.length, 0);
    assert.equal((await visitor.query('public_vendor_directory', { filters: [filter('id', seller.user.id)] })).data.length, 0);
    await seller.query('products', { operation: 'update', values: { stock: 9 }, filters: [filter('id', draft.id)] }, 403);
    await seller.upload(seller.user.id + '/store/blocked.png', 403);
    await buyer.action('create_order_v2', { ...order, _request_id: 'suspended-checkout', _total_amount: 12.5, _items: [{ id: draft.id, quantity: 1 }] }, 409);
    await admin.action('update_vendor_status', { _vendor_id: seller.user.id, _new_status: 'approved' });
    assert.equal((await visitor.query('public_vendor_directory', { filters: [filter('id', seller.user.id)], single: 'one' })).data.verified, false);
    console.log('Vendor acceptance: review replies, notification preferences, suspension and reactivation passed.');

    await admin.query('profiles', { operation: 'update', values: { ...profile, store_name: 'Administrator Campus Store' }, filters: [filter('user_id', admin.user.id)] });
    const adminStore = (await visitor.query('public_vendor_directory', { filters: [filter('id', admin.user.id)], single: 'one' })).data;
    assert.equal(adminStore.name, 'Administrator Campus Store'); assert.equal(adminStore.products, 0);
    assert.equal(adminStore.email, undefined); assert.equal(adminStore.role, undefined);
    await buyer.query('vendor_follows', { operation: 'insert', values: { vendor_id: seller.user.id } });
    assert.equal((await buyer.query('public_vendor_directory', { filters: [filter('id', seller.user.id)], single: 'one' })).data.is_following, true);
    assert.equal((await visitor.query('public_vendor_directory', { filters: [filter('id', seller.user.id)], single: 'one' })).data.followers, 1);
    assert.equal((await second.query('vendor_follows')).data.length, 0);
    await second.query('vendor_follows', { operation: 'delete', filters: [filter('vendor_id', seller.user.id)] });
    assert.equal((await buyer.query('vendor_follows')).data.length, 1);
    await buyer.query('vendor_follows', { operation: 'delete', filters: [filter('vendor_id', seller.user.id)] });
    assert.equal((await visitor.query('public_vendor_directory', { filters: [filter('id', seller.user.id)], single: 'one' })).data.followers, 0);
    await seller.query('coupons', { operation: 'insert', values: { code: 'SELLER1', discount_type: 'fixed_amount', discount_value: 1, usage_limit: 1, status: 'active' } });
    const deal = (await seller.query('deals', { operation: 'insert', values: { product_id: draft.id, discount_price: 10, start_time: new Date(Date.now() - 60000).toISOString(), end_time: new Date(Date.now() + 3600000).toISOString() }, single: 'one' })).data;
    await admin.query('deals', { operation: 'update', values: { approved_by_admin: true }, filters: [filter('id', deal.id)] });
    assert.equal((await visitor.query('products', { filters: [filter('id', draft.id)], single: 'one' })).data.current_price, 10);
    const discountedItems = [{ id: draft.id, quantity: 1 }, { id: other.id, quantity: 1 }];
    const quote = (await visitor.action('quote_checkout', { _items: discountedItems, _coupon_code: 'SELLER1' })).data;
    assert.equal(quote.subtotal, 18); assert.equal(quote.discount, 1); assert.equal(quote.total, 17);
    const discountedOrder = (await buyer.action('create_order_v2', { ...order, _request_id: 'discounted-order', _items: discountedItems, _total_amount: quote.total, _coupon_code: 'SELLER1' })).data;
    assert.equal((await seller.query('vendor_orders_secure', { filters: [filter('order_id', discountedOrder)], single: 'one' })).data.vendor_total, 9);
    await second.action('update_order_fulfillment', { _order_id: discountedOrder, _new_status: 'cancelled' });
    assert.equal((await buyer.query('orders', { filters: [filter('id', discountedOrder)], single: 'one' })).data.total_amount, 9);
    await buyer.action('cancel_buyer_order', { _order_id: discountedOrder });
    assert.equal((await buyer.query('orders', { filters: [filter('id', discountedOrder)], single: 'one' })).data.total_amount, 0);
    await visitor.action('quote_checkout', { _items: discountedItems, _coupon_code: 'SELLER1' }, 400);
    await admin.query('profiles', { operation: 'update', values: { store_name: null }, filters: [filter('user_id', admin.user.id)] });
    console.log('Vendor acceptance: admin-owned storefronts, private follows, real coupons, flash prices and buyer cancellation passed.');

    if (process.env.RUN_VENDOR_BROWSER === 'true') {
      const { verifyVendorBrowser } = await import('../vendor-browser.mjs');
      await verifyVendorBrowser({ connection, config, apiUrl, password, png });
    }
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    try { await connection.db.dropDatabase(); } finally { await connection.client.close(); }
  }
});
