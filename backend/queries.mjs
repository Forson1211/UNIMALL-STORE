import { approved, cleanObject, cents, fail, hasRole, identity, staff, text, timestamp } from './security.mjs';
import { transact } from './db.mjs';
import { lockAccount, notify } from './commerce.mjs';
import { lineTotalExpression } from './pricing.mjs';

const contentRoles = ['content_manager'];
const moderationRoles = ['moderator'];
const orderRoles = ['order_manager'];
const supportRoles = ['support_agent', 'moderator'];
const vendorRoles = ['vendor_manager'];
const aliases = { wishlist: 'wishlists', storefront_products_view: 'products', admin_orders_view: 'admin_orders_secure' };
const fields = {
  products: 'name description price original_price category image_url images features stock is_active same_day_delivery is_negotiable highlight condition',
  profiles: 'full_name store_name store_description phone address campus avatar_url banner_url store_category hostel_landmark same_day_delivery free_delivery notification_preferences updated_at',
  vendor_payment_methods: 'type label details is_default', reviews: 'product_id rating comment', wishlists: 'product_id',
  vendor_delivery_contacts: 'name phone role',
  vendor_follows: 'vendor_id',
  coupons: 'code discount_type discount_value usage_limit start_date end_date status',
  deals: 'product_id discount_price start_time end_time',
  support_tickets: 'subject description category priority', messages: 'receiver_id content read',
  notifications: 'user_id type title message link read',
  site_settings: 'setting_key setting_value setting_category',
  site_pages: 'title slug content meta_title meta_description is_published',
  campus_news: 'title excerpt content category image_url is_published publish_date',
  navigation_menus: 'menu_name menu_location menu_items is_active',
  media_library: 'file_name file_url file_type file_size bucket path alt_text uploaded_by',
  system_logs: 'type source message metadata',
};
const publicIdFields = new Set(['id', 'vendor_id', 'user_id', 'buyer_id', 'product_id', 'order_id', 'created_by', 'sender_id']);
const writable = (table, value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'Supply a record object.');
  const allowed = new Set((fields[table] || '').split(' '));
  const result = {};
  for (const [key, item] of Object.entries(cleanObject(value))) {
    if (allowed.has(key)) result[key] = item;
    else if (!publicIdFields.has(key) && !['created_at', 'updated_at', 'id', 'vendor', 'store_name', 'vendor_name', 'status', 'image', 'gallery', 'rating', 'reviews', 'vendor_reply', 'vendor_reply_at', 'is_featured', 'verified', 'user', 'product', 'usage_count', 'approved_by_admin', 'rejected_at', 'author_id'].includes(key)) fail(400, `Unsupported ${table} field: ${key}`);
  }
  return result;
};
const scalar = value => value === null || ['string', 'boolean', 'number'].includes(typeof value);
function safeField(field) {
  if (typeof field !== 'string' || !/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?$/.test(field) || field.split('.').some(k => ['__proto__', 'constructor', 'prototype', 'password_hash', 'token_hash'].includes(k))) fail(400, 'Unsupported filter field.');
  return field;
}
function likePattern(value) {
  if (typeof value !== 'string' || value.length > 300) fail(400, 'Invalid search text.');
  return '^' + value.split('%').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$';
}
export function buildFilter(filters = []) {
  if (!Array.isArray(filters) || filters.length > 30) fail(400, 'Too many query filters.');
  const clauses = filters.map(filter => {
    if (!filter || typeof filter !== 'object') fail(400, 'Invalid query filter.');
    if (filter.op === 'or') {
      if (typeof filter.value !== 'string' || filter.value.length > 1000) fail(400, 'Invalid search filter.');
      return { $or: filter.value.split(',').map(item => {
        const match = item.match(/^([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?)\.(eq|ilike)\.(.*)$/);
        if (!match) fail(400, 'Unsupported OR filter.');
        return buildFilter([{ field: match[1], op: match[2], value: match[3] }]);
      }) };
    }
    const field = safeField(filter.field);
    const value = filter.value;
    if (['eq', 'is'].includes(filter.op)) { if (!scalar(value)) fail(400, 'Filter values must be scalar.'); return { [field]: value }; }
    if (filter.op === 'in') {
      if (!Array.isArray(value) || value.length > 1000 || !value.every(scalar)) fail(400, 'Invalid list filter.');
      return { [field]: { $in: value } };
    }
    if (filter.op === 'ilike') return { [field]: { $regex: likePattern(value), $options: 'i' } };
    if (filter.op === 'contains') {
      if (!Array.isArray(value) || !value.every(scalar)) fail(400, 'Invalid contains filter.');
      return { [field]: { $all: value } };
    }
    fail(400, 'Unsupported query operation.');
  });
  return clauses.length ? { $and: clauses } : {};
}

function lookup(from, localField, as, project, array = false, extraMatch = {}) {
  const pipeline = [{ $match: extraMatch }, { $project: { _id: 0, ...project } }];
  return [{ $lookup: { from, localField, foreignField: 'id', as, pipeline } }, ...(array ? [] : [{ $set: { [as]: { $ifNull: [{ $arrayElemAt: [`$${as}`, 0] }, null] } } }])];
}
const productProjection = { id: 1, name: 1, image_url: 1, vendor_id: 1, price: 1, stock: 1, is_active: 1, description: 1, category: 1, created_at: 1 };
const profileLookup = (localField, as) => [{ $lookup: { from: 'profiles', localField, foreignField: 'user_id', as,
  pipeline: [{ $project: { _id: 0, user_id: 1, full_name: 1, avatar_url: 1, store_name: 1 } }] } }, { $set: { [as]: { $arrayElemAt: [`$${as}`, 0] } } }];

async function pipelineFor(db, user, resource) {
  const table = aliases[resource] || resource;
  const admin = hasRole(user, 'admin');
  const orderStaff = hasRole(user, 'admin', ...orderRoles);
  const moderator = hasRole(user, 'admin', ...moderationRoles);
  const sellerStaff = hasRole(user, 'admin', ...vendorRoles);
  const contentStaff = hasRole(user, 'admin', ...contentRoles);
  const approvedIds = async () => (await db.collection('users').find({ disabled: { $ne: true }, $or: [{ role: 'admin' }, { role: 'vendor', vendor_status: 'approved' }] }, { projection: { id: 1 } }).toArray()).map(u => u.id);
  const visibleProducts = async () => ({ is_active: true, vendor_id: { $in: await approvedIds() } });
  if (table === 'products' || table === 'admin_products_view') {
    if (table === 'admin_products_view') staff(user, ...moderationRoles);
    const scope = moderator ? {} : { $or: [await visibleProducts(), ...(user ? [{ vendor_id: user.id }] : [])] };
    const pipeline = [{ $match: scope }, ...profileLookup('vendor_id', 'seller'),
      { $lookup: { from: 'deals', localField: 'id', foreignField: 'product_id', as: 'live_deals', let: { sellerId: '$vendor_id' }, pipeline: [
        { $match: { approved_by_admin: true, rejected_at: null, start_time: { $lte: timestamp() }, end_time: { $gt: timestamp() }, $expr: { $eq: ['$vendor_id', '$$sellerId'] } } },
        { $sort: { discount_price: 1 } }, { $limit: 1 }, { $project: { _id: 0, discount_price: 1, end_time: 1 } },
      ] } }, { $set: { current_price: { $min: ['$price', { $ifNull: [{ $arrayElemAt: ['$live_deals.discount_price', 0] }, '$price'] }] }, deal_end_time: { $arrayElemAt: ['$live_deals.end_time', 0] } } }, { $unset: 'live_deals' },
      { $lookup: { from: 'reviews', localField: 'id', foreignField: 'product_id', as: 'review_stats', pipeline: [
        { $match: { status: 'approved' } }, { $group: { _id: null, rating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ] } }, { $set: { rating: { $ifNull: [{ $arrayElemAt: ['$review_stats.rating', 0] }, 0] }, reviews_count: { $ifNull: [{ $arrayElemAt: ['$review_stats.count', 0] }, 0] } } }, { $unset: 'review_stats' }];
    if (table === 'admin_products_view') pipeline.push({ $set: { product_id: '$id', product_name: '$name', stock_quantity: '$stock', status: { $cond: ['$is_active', 'active', 'draft'] }, vendor_name: '$seller.full_name', vendor_store: '$seller.store_name' } });
    return { collection: 'products', pipeline };
  }
  if (table === 'profiles') {
    identity(user);
    const canReadProfiles = hasRole(user, 'admin', ...vendorRoles, ...orderRoles, ...supportRoles);
    return { collection: table, pipeline: [{ $match: canReadProfiles ? {} : { user_id: user.id } }] };
  }
  if (table === 'user_roles' || table === 'admin_users_view' || table === 'public_vendor_directory' || table === 'vendor_management_view') {
    const pipeline = [{ $match: { disabled: { $ne: true } } }];
    if (table === 'public_vendor_directory') pipeline.push({ $match: { $or: [{ role: 'vendor', vendor_status: 'approved' }, { role: 'admin' }] } });
    else if (table === 'vendor_management_view') { staff(user, ...vendorRoles); pipeline.push({ $match: { role: 'vendor' } }); }
    else if (table === 'admin_users_view') staff(user, ...vendorRoles, ...supportRoles);
    else { identity(user); if (!sellerStaff) pipeline.push({ $match: { id: user.id } }); }
    if (table === 'user_roles') {
      pipeline.push({ $project: { _id: 0, id: 1, user_id: '$id', role: 1, vendor_status: 1, created_at: 1 } });
      return { collection: 'users', pipeline };
    }
    pipeline.push(...profileLookup('id', 'profile'));
    // The full profile is needed only inside this pipeline, never the users hash.
    pipeline.splice(pipeline.length - 2, 2,
      { $lookup: { from: 'profiles', localField: 'id', foreignField: 'user_id', as: 'profile' } },
      { $set: { profile: { $arrayElemAt: ['$profile', 0] } } });
    // Administrators may also run a store. A seeded admin without a saved store is not a merchant.
    if (table === 'public_vendor_directory') pipeline.push({ $match: { $or: [{ role: 'vendor' }, { 'profile.store_name': { $type: 'string', $regex: /\S/ } }] } });
    if (table === 'public_vendor_directory') pipeline.push({ $lookup: { from: 'vendor_follows', localField: 'id', foreignField: 'vendor_id', as: 'follows', pipeline: [
      { $group: { _id: null, count: { $sum: 1 }, following: { $max: { $cond: [{ $eq: ['$user_id', user?.id || null] }, 1, 0] } } } },
    ] } });
    pipeline.push({ $lookup: { from: 'products', localField: 'id', foreignField: 'vendor_id', as: 'inventory', pipeline: [{ $project: { id: 1, is_active: 1 } }] } },
      { $lookup: { from: 'reviews', let: { productIds: '$inventory.id' }, as: 'review_stats', pipeline: [
        { $match: { status: 'approved', $expr: { $in: ['$product_id', '$$productIds'] } } }, { $group: { _id: null, rating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ] } });
    const base = { _id: 0, id: 1, user_id: '$id', name: { $ifNull: ['$profile.store_name', '$profile.full_name'] }, full_name: '$profile.full_name',
      store_name: '$profile.store_name', avatar_url: '$profile.avatar_url', banner: '$profile.banner_url', description: '$profile.store_description',
      store_description: '$profile.store_description', campus: '$profile.campus', phone: '$profile.phone', category: '$profile.store_category',
      hostel_landmark: '$profile.hostel_landmark', same_day_delivery: '$profile.same_day_delivery', free_delivery: '$profile.free_delivery',
      rating: { $ifNull: [{ $arrayElemAt: ['$review_stats.rating', 0] }, 0] }, reviews_count: { $ifNull: [{ $arrayElemAt: ['$review_stats.count', 0] }, 0] }, verified: { $eq: ['$profile.verified', true] },
      products: { $size: { $filter: { input: '$inventory', as: 'p', cond: '$$p.is_active' } } } };
    if (table === 'public_vendor_directory') Object.assign(base, { followers: { $ifNull: [{ $arrayElemAt: ['$follows.count', 0] }, 0] }, is_following: { $eq: [{ $arrayElemAt: ['$follows.following', 0] }, 1] } });
    if (table !== 'public_vendor_directory') Object.assign(base, { email: 1, role: 1, vendor_status: 1, vendor_since: '$created_at', joined_at: '$created_at', last_sign_in_at: 1,
      product_count: { $size: '$inventory' }, total_products_as_vendor: { $size: '$inventory' }, address: '$profile.address' });
    if (table === 'vendor_management_view') {
      pipeline.push({ $lookup: { from: 'order_items', localField: 'id', foreignField: 'vendor_id', as: 'sales', pipeline: [{ $match: { fulfillment_status: 'delivered' } },
        { $lookup: { from: 'orders', localField: 'order_id', foreignField: 'id', as: 'order' } }, { $unwind: '$order' }, { $match: { 'order.status': 'delivered', 'order.payment_status': { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, amount: { $sum: lineTotalExpression } } }] } });
      base.total_sales = { $ifNull: [{ $arrayElemAt: ['$sales.amount', 0] }, 0] };
    }
    pipeline.push({ $project: base });
    return { collection: 'users', pipeline };
  }
  if (table === 'orders' || table === 'admin_orders_secure') {
    identity(user); if (table === 'admin_orders_secure' && !orderStaff) fail(403, 'Only order staff can view all orders.');
    const pipeline = [{ $match: orderStaff ? {} : { buyer_id: user.id } }, { $lookup: { from: 'order_items', localField: 'id', foreignField: 'order_id', as: 'order_items',
      pipeline: [...lookup('products', 'product_id', 'products', productProjection), { $set: { products: { $ifNull: ['$products', { id: '$product_id', name: '$product_name', image_url: '$product_image' }] } } }, { $project: { _id: 0 } }] } }];
    if (table === 'admin_orders_secure') pipeline.push({ $set: { order_id: '$id', order_status: '$status', buyer_name: '$shipping_details.fullName', buyer_email: '$shipping_details.email', item_count: { $size: '$order_items' },
      items: { $map: { input: '$order_items', as: 'i', in: { product_id: '$$i.product_id', product_name: '$$i.products.name', vendor_id: '$$i.vendor_id', quantity: '$$i.quantity', price: '$$i.price_at_purchase', total_price: { $ifNull: ['$$i.total_price', { $multiply: ['$$i.price_at_purchase', '$$i.quantity'] }] }, status: '$$i.fulfillment_status' } } } } });
    return { collection: 'orders', pipeline };
  }
  if (table === 'order_items' || table === 'vendor_orders_secure') {
    identity(user);
    const ownOrders = table === 'order_items' && !orderStaff ? (await db.collection('orders').find({ buyer_id: user.id }, { projection: { id: 1 } }).toArray()).map(o => o.id) : [];
    const scope = orderStaff ? {} : table === 'vendor_orders_secure' ? { vendor_id: user.id } : { $or: [{ vendor_id: user.id }, { order_id: { $in: ownOrders } }] };
    const pipeline = [{ $match: scope }, ...lookup('products', 'product_id', 'products', productProjection)];
    if (table === 'vendor_orders_secure') {
      pipeline.push({ $group: { _id: { order_id: '$order_id', vendor_id: '$vendor_id' }, statuses: { $push: '$fulfillment_status' }, vendor_total: { $sum: { $cond: [{ $eq: ['$fulfillment_status', 'cancelled'] }, 0, lineTotalExpression] } }, item_count: { $sum: 1 } } },
        { $lookup: { from: 'orders', localField: '_id.order_id', foreignField: 'id', as: 'order' } }, { $unwind: '$order' },
        { $set: { order_id: '$_id.order_id', vendor_id: '$_id.vendor_id', created_at: '$order.created_at', payment_status: '$order.payment_status', payment_method: '$order.payment_method',
          shipping_address: '$order.shipping_address', shipping_details: '$order.shipping_details', buyer_name: '$order.shipping_details.fullName', buyer_email: '$order.shipping_details.email',
          order_status: { $switch: { branches: [
            { case: { $setIsSubset: ['$statuses', ['cancelled']] }, then: 'cancelled' },
            { case: { $in: ['pending', '$statuses'] }, then: 'pending' },
            { case: { $gt: [{ $size: { $setIntersection: ['$statuses', ['confirmed', 'processing']] } }, 0] }, then: 'confirmed' },
            { case: { $in: ['shipped', '$statuses'] }, then: 'shipped' }], default: 'delivered' } } } }, { $unset: ['order', 'statuses'] });
    }
    return { collection: 'order_items', pipeline };
  }
  if (table === 'reviews') {
    const ownProducts = user ? (await db.collection('products').find({ vendor_id: user.id }, { projection: { id: 1 } }).toArray()).map(p => p.id) : [];
    return { collection: table, pipeline: [{ $match: moderator ? {} : { $or: [{ status: 'approved' }, ...(user ? [{ user_id: user.id }, { product_id: { $in: ownProducts } }] : [])] } },
      ...lookup('products', 'product_id', 'product', productProjection), ...profileLookup('user_id', 'user')] };
  }
  if (table === 'wishlists') {
    identity(user); return { collection: table, pipeline: [{ $match: { user_id: user.id } }, ...lookup('products', 'product_id', 'products', productProjection, false, await visibleProducts())] };
  }
  if (table === 'deals' || table === 'active_flash_deals') {
    const scope = table === 'active_flash_deals' ? { approved_by_admin: true, rejected_at: null, start_time: { $lte: timestamp() }, end_time: { $gt: timestamp() } } : moderator ? {} : { vendor_id: identity(user) };
    return { collection: 'deals', pipeline: [{ $match: scope }, ...lookup('products', 'product_id', 'product', productProjection, false, table === 'active_flash_deals' ? await visibleProducts() : {}), ...profileLookup('vendor_id', 'vendor'),
      ...(table === 'active_flash_deals' ? [{ $match: { product: { $ne: null } } }, { $set: { name: '$product.name', image: '$product.image_url', stock: '$product.stock', original_price: '$product.price', category: '$product.category', vendor_name: '$vendor.store_name' } }] : [])] };
  }
  if (table === 'vendor_payment_methods' || table === 'payout_requests') {
    identity(user); return { collection: table, pipeline: [{ $match: orderStaff && table === 'payout_requests' ? {} : { vendor_id: user.id } }] };
  }
  if (table === 'vendor_delivery_contacts') { identity(user); return { collection: table, pipeline: [{ $match: { vendor_id: user.id } }] }; }
  if (table === 'vendor_follows') { identity(user); return { collection: table, pipeline: [{ $match: { user_id: user.id } }] }; }
  if (table === 'transactions') { identity(user); return { collection: table, pipeline: [{ $match: orderStaff ? {} : { user_id: user.id } }] }; }
  if (table === 'notifications') { identity(user); return { collection: table, pipeline: [{ $match: admin ? {} : { user_id: user.id } }] }; }
  if (table === 'messages') {
    identity(user); return { collection: table, pipeline: [{ $match: hasRole(user, 'admin', ...supportRoles) ? {} : { $or: [{ sender_id: user.id }, { receiver_id: user.id }] } }, ...profileLookup('sender_id', 'sender'), ...profileLookup('receiver_id', 'receiver')] };
  }
  if (table === 'support_tickets') { identity(user); return { collection: table, pipeline: [{ $match: hasRole(user, 'admin', ...supportRoles) ? {} : { user_id: user.id } }] }; }
  if (table === 'system_logs') { staff(user); return { collection: table, pipeline: [] }; }
  if (table === 'coupons') { identity(user); return { collection: table, pipeline: [{ $match: moderator ? {} : { created_by: user.id } }] }; }
  if (['campus_news', 'site_pages', 'navigation_menus'].includes(table)) {
    return { collection: table, pipeline: [{ $match: contentStaff ? {} : { [table === 'navigation_menus' ? 'is_active' : 'is_published']: true } }] };
  }
  if (table === 'site_settings') return { collection: table, pipeline: [{ $match: contentStaff ? {} : { setting_key: { $not: /password|secret|token|private|api_key/i } } }] };
  if (table === 'media_library') { staff(user, ...contentRoles); return { collection: table, pipeline: [] }; }
  if (table === 'admin_dashboard_stats') {
    staff(user, ...moderationRoles, ...vendorRoles, ...orderRoles, ...contentRoles, ...supportRoles);
    const [users, products, orders] = await Promise.all(['users', 'products', 'orders'].map(name => db.collection(name).find({}, { projection: name === 'users' ? { role: 1, disabled: 1, vendor_status: 1, created_at: 1 } : {} }).toArray()));
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    return { rows: [{ total_users: users.length, total_vendors: users.filter(u => u.role === 'vendor').length, total_buyers: users.filter(u => u.role === 'buyer').length,
      total_admins: users.filter(u => u.role === 'admin').length, total_products: products.length, active_products: products.filter(p => p.is_active).length,
      draft_products: products.filter(p => !p.is_active).length, vendors_pending: users.filter(u => u.role === 'vendor' && u.vendor_status === 'pending' && !u.disabled).length,
      vendors_approved: users.filter(u => u.role === 'vendor' && u.vendor_status === 'approved' && !u.disabled).length,
      vendors_suspended: users.filter(u => u.role === 'vendor' && u.vendor_status === 'suspended' && !u.disabled).length,
      new_users_week: users.filter(u => u.created_at >= weekAgo).length, new_orders_week: orders.filter(o => o.created_at >= weekAgo).length,
      total_orders: orders.length, pending_orders: orders.filter(o => o.status === 'pending').length,
      total_revenue: orders.filter(o => o.status === 'delivered' && ['paid', 'completed'].includes(o.payment_status)).reduce((sum, o) => sum + cents(o.total_amount), 0) / 100 }] };
  }
  if (table === 'vendor_weekly_sales' || table === 'top_selling_products') {
    const weekly = table === 'vendor_weekly_sales';
    const pipeline = [{ $match: weekly ? { vendor_id: identity(user), fulfillment_status: 'delivered' } : { fulfillment_status: 'delivered' } },
      { $lookup: { from: 'orders', localField: 'order_id', foreignField: 'id', as: 'order' } }, { $unwind: '$order' },
      { $match: { 'order.status': 'delivered', 'order.payment_status': { $in: ['paid', 'completed'] } } }];
    if (weekly) {
      pipeline.push({ $group: { _id: { $dateTrunc: { date: { $toDate: '$order.created_at' }, unit: 'week', startOfWeek: 'monday', timezone: 'UTC' } },
        revenue: { $sum: lineTotalExpression }, order_ids: { $addToSet: '$order_id' } } },
      { $project: { _id: 0, vendor_id: { $literal: user.id }, week_start: { $dateToString: { date: '$_id', format: '%Y-%m-%d', timezone: 'UTC' } }, revenue: { $round: ['$revenue', 2] }, orders: { $size: '$order_ids' } } });
    } else {
      pipeline.push({ $group: { _id: '$product_id', total_quantity: { $sum: '$quantity' }, order_ids: { $addToSet: '$order_id' } } },
        ...lookup('products', '_id', 'product', productProjection, false, await visibleProducts()), { $match: { product: { $ne: null } } },
        { $replaceRoot: { newRoot: { $mergeObjects: ['$product', { image: '$product.image_url', total_quantity: '$total_quantity', total_orders: { $size: '$order_ids' } }] } } });
    }
    return { collection: 'order_items', pipeline };
  }
  fail(400, 'Unknown API resource.');
}

// Limit projection syntax to the existing public API contract, never arbitrary Mongo expressions.
export function projectRow(row, selection = '*') {
  const strip = value => {
    if (Array.isArray(value)) return value.map(strip);
    if (!value || typeof value !== 'object' || value instanceof Date) return value;
    return Object.fromEntries(Object.entries(value).filter(([key]) => !['_id', 'password_hash', 'token_hash', 'commerce_version', 'seller'].includes(key)).map(([key, val]) => [key, strip(val)]));
  };
  row = strip(row);
  const split = str => { let level = 0; const parts = []; let begin = 0; for (let i = 0; i < str.length; i++) { if (str[i] === '(') level++; if (str[i] === ')') level--; if (str[i] === ',' && level === 0) { parts.push(str.slice(begin, i)); begin = i + 1; } } parts.push(str.slice(begin)); return parts.map(s => s.trim()).filter(Boolean); };
  const output = {};
  for (const part of split(selection)) {
    if (part === '*') { Object.assign(output, row); continue; }
    const nested = part.match(/^([a-z_]+(?::[a-z_]+)?)(?:![a-z_]+)?\((.*)\)$/s);
    if (nested) {
      const [alias, relation] = nested[1].includes(':') ? nested[1].split(':') : [nested[1], nested[1]];
      const val = row[alias] ?? row[relation];
      output[alias] = Array.isArray(val) ? val.map(item => projectRow(item, nested[2])) : val ? projectRow(val, nested[2]) : null;
    } else { const key = safeField(part); if (Object.hasOwn(row, key)) output[key] = row[key]; }
  }
  return output;
}

export async function readQuery(db, user, query) {
  const source = await pipelineFor(db, user, query.table);
  const filter = buildFilter(query.filters);
  const offset = Number(query.offset || 0), limit = Number(query.limit ?? 500);
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 0 || limit > 1000) fail(400, 'Invalid pagination.');
  const sorts = Array.isArray(query.orders) ? query.orders.slice(0, 4) : [];
  const sort = Object.fromEntries(sorts.map(order => [safeField(order.field), order.ascending ? 1 : -1]));
  let rows, count;
  if (source.rows) { rows = source.rows; count = rows.length; }
  else {
    const pipeline = [...source.pipeline, { $match: filter }, ...(Object.keys(sort).length ? [{ $sort: sort }] : [{ $sort: { id: 1, _id: 1 } }]),
      { $facet: { rows: [{ $skip: offset }, { $limit: Math.max(limit, 1) }], count: [{ $count: 'total' }] } }];
    const [result] = await db.collection(source.collection).aggregate(pipeline, { maxTimeMS: 10000 }).toArray();
    rows = limit === 0 ? [] : result?.rows || []; count = result?.count[0]?.total || 0;
  }
  const data = rows.map(row => projectRow(row, query.selection || '*'));
  if (query.single) {
    if (data.length !== 1) { if (query.single === 'maybe' && data.length === 0) return { data: null, count }; fail(409, 'This record was not found or changed. Refresh and retry.', 'PGRST116'); }
    return { data: data[0], count };
  }
  return { data: query.head ? null : data, count };
}

function requireProfile(profile) {
  if (!profile || !['phone', 'campus', 'store_description', 'avatar_url', 'banner_url'].every(key => typeof profile[key] === 'string' && profile[key].trim()) || !(profile.store_name || profile.full_name)?.trim()) fail(400, 'Save your complete store profile before listing products.');
}
async function validateWrite(db, session, user, table, input, existing) {
  const row = writable(table, input);
  const admin = hasRole(user, 'admin');
  for (const key of publicIdFields) {
    if (input[key] !== undefined && existing?.[key] !== undefined && input[key] !== existing[key]) fail(403, 'Record ownership cannot be changed.');
  }
  if (table === 'profiles') {
    if (!admin && Object.keys(input).some(k => ['verified', 'rating', 'is_pro', 'role', 'vendor_status'].includes(k))) fail(403, 'Only staff can set account trust fields.');
    if (admin) for (const key of ['verified', 'rating']) if (input[key] !== undefined) row[key] = input[key];
    for (const key of ['full_name', 'store_name', 'store_description', 'phone', 'address', 'campus', 'avatar_url', 'banner_url', 'store_category', 'hostel_landmark']) {
      if (row[key] !== undefined && row[key] !== null && (typeof row[key] !== 'string' || row[key].length > (key === 'store_description' ? 5000 : 1000))) fail(400, `Enter a valid ${key.replaceAll('_', ' ')}.`);
      if (typeof row[key] === 'string') row[key] = row[key].trim();
    }
    for (const key of ['same_day_delivery', 'free_delivery']) if (row[key] !== undefined && typeof row[key] !== 'boolean') fail(400, 'Delivery preferences must be true or false.');
    if (row.notification_preferences !== undefined && (!row.notification_preferences || Array.isArray(row.notification_preferences) || typeof row.notification_preferences !== 'object' || Object.values(row.notification_preferences).some(value => typeof value !== 'boolean'))) fail(400, 'Notification preferences must be true or false.');
  } else if (table === 'products') {
    if (!hasRole(user, 'admin', ...moderationRoles) && !approved(user)) fail(403, 'Only approved sellers can manage products.');
    if (Object.hasOwn(input, 'is_featured')) { staff(user, ...moderationRoles); row.is_featured = input.is_featured === true; }
    const merged = { ...(existing || {}), ...row };
    if (typeof merged.description !== 'string' || merged.description.length > 20000) fail(400, 'Enter a valid product description.');
    for (const key of ['is_active', 'same_day_delivery', 'is_negotiable']) if (merged[key] !== undefined && typeof merged[key] !== 'boolean') fail(400, 'Listing options must be true or false.');
    text(merged.name, 'product name', 1, 250);
    if (cents(Number(merged.price)) <= 0) fail(400, 'Product price must be greater than zero.');
    if (merged.stock == null || merged.stock === '' || !Number.isSafeInteger(Number(merged.stock)) || Number(merged.stock) < 0) fail(400, 'Stock must be a whole number of zero or more.');
    if (row.price !== undefined) row.price = Number(row.price);
    if (row.stock !== undefined) row.stock = Number(row.stock);
    if (!existing) { row.vendor_id = admin ? input.vendor_id || user.id : user.id; row.is_active = input.is_active !== false; }
    const profile = await db.collection('profiles').findOne({ user_id: row.vendor_id || existing?.vendor_id }, { session });
    if (!admin && (!existing || (merged.is_active && Object.keys(row).some(k => k !== 'stock' && k !== 'updated_at')))) requireProfile(profile);
    if (!admin && existing?.description?.includes('"deleted_by":"admin"')) fail(403, 'Staff removed this listing.');
    if (merged.is_active && !/^https?:\/\//i.test(merged.image_url || '')) fail(400, 'Upload a product photo before publishing.');
  } else if (table === 'vendor_delivery_contacts') {
    if (!approved(user)) fail(403, 'Only approved sellers can manage delivery contacts.');
    const merged = { ...existing, ...row };
    row.name = text(merged.name, 'contact name', 2, 120);
    row.phone = text(merged.phone, 'contact phone', 9, 30);
    if (!/^\+?[0-9\s-]{9,30}$/.test(row.phone)) fail(400, 'Enter a valid contact phone number.');
    row.role = text(merged.role, 'contact role', 2, 120);
    if (!existing) Object.assign(row, { vendor_id: user.id, status: 'Active' });
  } else if (table === 'vendor_payment_methods') {
    if (!approved(user)) fail(403, 'Only approved sellers can manage payout destinations.');
    const merged = { ...existing, ...row };
    if (!['momo', 'bank'].includes(merged.type)) fail(400, 'Choose a valid payout method.');
    text(merged.label, 'payout label', 1, 120); text(merged.details?.accountNumber, 'account number', 5, 80);
    if (!existing) {
      row.vendor_id = user.id;
      row.is_default = input.is_default === true || await db.collection(table).countDocuments({ vendor_id: user.id }, { session }) === 0;
    }
    if (existing?.is_default && row.is_default === false) fail(400, 'Choose another default payout destination instead.');
    if (row.is_default === true) await db.collection(table).updateMany({ vendor_id: user.id, id: { $ne: existing?.id || '' } }, { $set: { is_default: false } }, { session });
  } else if (table === 'wishlists') {
    row.user_id = user.id;
    if (!existing && !await db.collection('products').findOne({ id: input.product_id, is_active: true }, { session })) fail(404, 'Product not available.');
  } else if (table === 'reviews') {
    if (existing) { staff(user, ...moderationRoles); return { status: ['approved', 'rejected'].includes(input.status) ? input.status : fail(400, 'Invalid review status.') }; }
    const orderIds = (await db.collection('orders').find({ buyer_id: user.id }, { session, projection: { id: 1 } }).toArray()).map(o => o.id);
    if (!await db.collection('order_items').findOne({ order_id: { $in: orderIds }, product_id: input.product_id, fulfillment_status: 'delivered' }, { session })) fail(403, 'Only buyers of delivered products can review them.');
    if (!Number.isInteger(row.rating) || row.rating < 1 || row.rating > 5) fail(400, 'Choose a rating from 1 to 5.');
    row.comment = text(row.comment, 'review', 1, 5000); row.user_id = user.id; row.status = 'pending';
    row.reviewer_name = user.full_name || 'Campus Buyer';
  } else if (table === 'support_tickets') {
    if (existing) { staff(user, ...supportRoles); if (!['open', 'in_progress', 'resolved', 'closed'].includes(input.status)) fail(400, 'Invalid ticket status.'); return { status: input.status }; }
    row.subject = text(row.subject, 'subject', 2, 250); row.description = text(row.description, 'description', 2, 10000); row.user_id = user.id; row.status = 'open';
  } else if (table === 'notifications') {
    if (existing) return { read: input.read === true };
    staff(user); row.title = text(row.title, 'notification title', 1, 250);
    if (!await db.collection('users').findOne({ id: row.user_id }, { session })) fail(404, 'Recipient not found.');
    row.read = false;
  } else if (table === 'messages') {
    if (existing) return { read: input.read === true };
    row.content = text(row.content, 'message', 1, 10000); row.sender_id = user.id;
    if (!await db.collection('users').findOne({ id: row.receiver_id, disabled: { $ne: true } }, { session })) fail(404, 'Recipient not found.');
    row.read = false;
  } else if (table === 'vendor_follows') {
    if (existing) fail(400, 'Remove a follow before choosing another store.');
    const seller = await db.collection('users').findOne({ id: row.vendor_id }, { session });
    if (!approved(seller)) fail(404, 'This store is unavailable.');
    if (seller.id === user.id) fail(400, 'You cannot follow your own store.');
    if (seller.role === 'admin' && !(await db.collection('profiles').findOne({ user_id: seller.id }, { session }))?.store_name?.trim()) fail(404, 'This store is unavailable.');
    row.user_id = user.id;
  } else if (table === 'deals') {
    if (existing && hasRole(user, 'admin', ...moderationRoles)) return { ...(Object.hasOwn(input, 'approved_by_admin') ? { approved_by_admin: input.approved_by_admin === true } : {}), ...(input.rejected_at ? { rejected_at: timestamp() } : {}) };
    if (!approved(user)) fail(403, 'Only approved vendors can submit deals.');
    const product = await db.collection('products').findOne({ id: row.product_id, vendor_id: user.id, is_active: true }, { session });
    if (!product || product.stock < 1 || cents(row.discount_price) <= 0 || cents(row.discount_price) >= cents(product.price)) fail(400, 'Choose an available product and a lower positive deal price.');
    const start = new Date(row.start_time), end = new Date(row.end_time);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end <= new Date()) fail(400, 'Invalid deal period.');
    Object.assign(row, { vendor_id: user.id, approved_by_admin: false, rejected_at: null, start_time: start.toISOString(), end_time: end.toISOString() });
  } else if (table === 'coupons') {
    if (!hasRole(user, 'admin', ...moderationRoles) && !approved(user)) fail(403, 'Only approved sellers can manage coupons.');
    const merged = { ...existing, ...row };
    if (!['percentage', 'fixed_amount'].includes(merged.discount_type) || !Number.isFinite(merged.discount_value) || merged.discount_value <= 0 || (merged.discount_type === 'percentage' && merged.discount_value > 100)) fail(400, 'Invalid coupon discount.');
    row.code = text(merged.code, 'coupon code', 2, 40).toUpperCase(); if (!existing) { row.created_by = user.id; row.usage_count = 0; }
    if (!existing) row.scope = hasRole(user, 'admin', ...moderationRoles) ? 'platform' : 'vendor';
    if (!['active', 'disabled', 'expired'].includes(merged.status || 'active')) fail(400, 'Invalid coupon status.');
    row.status = merged.status || 'active';
    if (merged.usage_limit != null && (!Number.isSafeInteger(merged.usage_limit) || merged.usage_limit < 1 || merged.usage_limit < (existing?.usage_count || 0))) fail(400, 'Usage limit must be a positive whole number and cover existing redemptions.');
    for (const key of ['start_date', 'end_date']) {
      const value = merged[key];
      if (!value) { row[key] = null; continue; }
      const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) && key === 'end_date' ? value + 'T23:59:59.999Z' : value);
      if (!Number.isFinite(date.getTime())) fail(400, 'Choose valid coupon dates.');
      row[key] = date.toISOString();
    }
    if (row.start_date && row.end_date && row.start_date >= row.end_date) fail(400, 'Coupon expiry must follow its start date.');
  } else if (table === 'system_logs') { staff(user); row.user_id = user.id; }
  else if (['site_settings', 'site_pages', 'campus_news', 'navigation_menus', 'media_library'].includes(table)) {
    staff(user, ...contentRoles);
    if (table === 'site_settings') text(row.setting_key || existing?.setting_key, 'setting key', 1, 120);
    if (['site_pages', 'campus_news'].includes(table)) text(row.title || existing?.title, 'title', 1, 250);
    if (table === 'site_pages' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug || existing?.slug || '')) fail(400, 'Use a lowercase page slug with hyphens.');
    if (table === 'campus_news' && !existing) { row.author_id = user.id; row.publish_date ||= timestamp(); }
    if (table === 'navigation_menus') {
      const merged = { ...existing, ...row };
      row.menu_name = text(merged.menu_name, 'menu name', 1, 120);
      if (!['header', 'footer'].includes(merged.menu_location)) fail(400, 'Choose a header or footer menu location.');
      if (!Array.isArray(merged.menu_items) || merged.menu_items.length > 50 || merged.menu_items.some(link => !link || typeof link.label !== 'string' || !link.label.trim() || typeof link.url !== 'string' || !(/^(?:\/(?!\/)|https:\/\/|mailto:|tel:)/i.test(link.url)) || /[\s\\]/.test(link.url))) fail(400, 'Use valid navigation labels and links.');
    }
    if (table === 'media_library' && !existing) { row.uploaded_by = user.id; row.uploaded_at = timestamp(); }
  }
  return row;
}

function writeScope(user, table) {
  identity(user);
  if (table === 'profiles') return hasRole(user, 'admin') ? {} : { user_id: user.id };
  if (table === 'products') return hasRole(user, 'admin', ...moderationRoles) ? {} : { vendor_id: user.id };
  if (table === 'reviews') { staff(user, ...moderationRoles); return {}; }
  if (['vendor_payment_methods', 'vendor_delivery_contacts'].includes(table)) { if (!approved(user)) fail(403, 'Only approved sellers can manage these records.'); return { vendor_id: user.id }; }
  if (table === 'deals') return hasRole(user, 'admin', ...moderationRoles) ? {} : { vendor_id: user.id };
  if (table === 'wishlists') return { user_id: user.id };
  if (table === 'coupons') return hasRole(user, 'admin', ...moderationRoles) ? {} : { created_by: user.id };
  if (table === 'vendor_follows') return { user_id: user.id };
  if (table === 'notifications') return hasRole(user, 'admin') ? {} : { user_id: user.id };
  if (table === 'messages') return { receiver_id: user.id };
  if (table === 'support_tickets') { staff(user, ...supportRoles); return {}; }
  if (table === 'system_logs') { staff(user); return {}; }
  if (['site_settings', 'site_pages', 'campus_news', 'navigation_menus', 'media_library'].includes(table)) { staff(user, ...contentRoles); return {}; }
  fail(403, 'Use the dedicated server action for this operation.');
}

export async function mutateQuery(ctx, query) {
  const { db, client } = ctx;
  let user = ctx.user;
  identity(user);
  const table = aliases[query.table] || query.table;
  if (!Object.hasOwn(fields, table)) fail(403, 'This resource cannot be modified directly.');
  const op = query.operation;
  const inputs = Array.isArray(query.values) ? query.values : [query.values];
  if (inputs.length > 1000) fail(400, 'Write batches may contain at most 1000 records.');
  const rows = await transact(client, async session => {
    user = await lockAccount(db, session, ctx.user.id);
    const results = [];
    if (['update', 'delete'].includes(op)) {
      if (!query.filters?.length) fail(400, 'Updates and removals require an explicit filter.');
      const scope = writeScope(user, table);
      const filter = { $and: [scope, buildFilter(query.filters)] };
      const records = await db.collection(table).find(filter, { session }).limit(1001).toArray();
      if (records.length > 1000) fail(400, 'Choose a smaller batch.');
      if (op === 'delete' && !['products', 'wishlists', 'vendor_payment_methods', 'vendor_delivery_contacts', 'vendor_follows', 'coupons', 'deals', 'site_pages', 'campus_news', 'navigation_menus', 'media_library'].includes(table)) fail(403, 'This resource cannot be deleted.');
      for (const record of records) {
        if (op === 'delete') {
          if (table === 'products') { staff(user, ...moderationRoles); await db.collection(table).updateOne({ id: record.id }, { $set: { is_active: false } }, { session }); }
          else await db.collection(table).deleteOne({ id: record.id }, { session });
          if (table === 'vendor_payment_methods' && record.is_default) {
            const next = await db.collection(table).findOne({ vendor_id: user.id }, { session, sort: { created_at: 1, id: 1 } });
            if (next) await db.collection(table).updateOne({ id: next.id }, { $set: { is_default: true } }, { session });
          }
          results.push(record); continue;
        }
        const data = await validateWrite(db, session, user, table, query.values, record);
        await db.collection(table).updateOne({ id: record.id }, { $set: { ...data, updated_at: timestamp() } }, { session });
        results.push({ ...record, ...data });
        if (table === 'products' && record.stock > 3 && data.stock <= 3) await notify(db, session, record.vendor_id, 'low_stock', 'Low Stock', `${record.name} is running low.`, '/vendor/products', 'warning');
      }
    } else if (['insert', 'upsert'].includes(op)) {
      for (const input of inputs) {
        if (!input || typeof input !== 'object') fail(400, 'Invalid record.');
        if (input.user_id && !hasRole(user, 'admin') && input.user_id !== user.id) fail(403, 'Record owner must match your account.');
        let existing = null;
        if (op === 'upsert') {
          if (table === 'wishlists') existing = await db.collection(table).findOne({ user_id: user.id, product_id: input.product_id }, { session });
          else if (table === 'site_settings') { staff(user, ...contentRoles); existing = await db.collection(table).findOne({ setting_key: input.setting_key }, { session }); }
          else fail(400, 'Upsert is not supported for this resource.');
        }
        if (existing) { const data = await validateWrite(db, session, user, table, input, existing); await db.collection(table).updateOne({ id: existing.id }, { $set: data }, { session }); results.push({ ...existing, ...data }); }
        else {
          // Insert permissions are checked independently of ownership update scopes.
          if (['profiles', 'messages', 'reviews', 'wishlists', 'support_tickets'].includes(table)) { if (table === 'profiles') fail(403, 'Profiles are created when accounts are registered.'); }
          else writeScope(user, table);
          const data = await validateWrite(db, session, user, table, input, null);
          const doc = { ...data, id: crypto.randomUUID(), created_at: timestamp(), updated_at: timestamp() };
          await db.collection(table).insertOne(doc, { session }); results.push(doc);
          if (table === 'reviews') { const product = await db.collection('products').findOne({ id: doc.product_id }, { session }); if (product) await notify(db, session, product.vendor_id, 'product_reviews', 'New Review', 'A customer reviewed your product.', '/vendor/reviews'); }
        }
      }
    } else fail(400, 'Unsupported write operation.');
    return results;
  });
  const data = rows.map(row => projectRow(row, query.selection || '*'));
  if (query.single) { if (data.length !== 1) fail(409, 'This record was not found or changed. Refresh and retry.', 'PGRST116'); return { data: data[0] }; }
  return { data };
}

export async function listManagedVendors(db, user) {
  staff(user, ...vendorRoles);
  return (await readQuery(db, user, { table: 'vendor_management_view' })).data;
}
