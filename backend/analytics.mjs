import { approved, fail, identity, staff } from './security.mjs';
import { lineTotalExpression } from './pricing.mjs';

const collected = { $and: [{ $eq: ['$status', 'delivered'] }, { $in: ['$payment_status', ['paid', 'completed']] }] };
const sellerStatus = { $switch: { branches: [
  { case: { $setIsSubset: ['$statuses', ['cancelled']] }, then: 'cancelled' },
  { case: { $in: ['pending', '$statuses'] }, then: 'pending' },
  { case: { $gt: [{ $size: { $setIntersection: ['$statuses', ['confirmed', 'processing']] } }, 0] }, then: 'confirmed' },
  { case: { $in: ['shipped', '$statuses'] }, then: 'shipped' },
], default: 'delivered' } };

export async function commerceAnalytics(db, user, scope, params = {}, now = new Date()) {
  identity(user);
  if (scope === 'admin') staff(user, 'order_manager');
  else if (scope !== 'vendor' || !approved(user)) fail(403, 'An approved seller account is required.');
  const days = params.days ?? 30;
  if (![7, 30, 90, 365].includes(days)) fail(400, 'Choose a supported reporting period.');
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const start = new Date(end.getTime() - days * 86400000);
  const range = { $gte: start.toISOString(), $lt: end.toISOString() };
  // Group a vendor's own lines before calculating status and money. A mixed-store
  // order must never contribute another merchant's revenue or customer details.
  const pipeline = scope === 'vendor' ? [
    { $match: { vendor_id: user.id } },
    { $group: { _id: '$order_id', statuses: { $push: '$fulfillment_status' }, items: { $push: '$$ROOT' }, amount: { $sum: { $cond: [{ $eq: ['$fulfillment_status', 'cancelled'] }, 0, lineTotalExpression] } } } },
    { $lookup: { from: 'orders', localField: '_id', foreignField: 'id', as: 'order' } }, { $unwind: '$order' },
    { $project: { _id: 0, created_at: '$order.created_at', payment_status: '$order.payment_status', status: sellerStatus, amount: 1, items: 1 } },
    { $match: { created_at: range } },
  ] : [
    { $match: { created_at: range } },
    { $lookup: { from: 'order_items', localField: 'id', foreignField: 'order_id', as: 'items' } },
    { $project: { _id: 0, created_at: 1, payment_status: 1, status: 1, amount: '$total_amount', items: 1 } },
  ];
  pipeline.push({ $facet: {
    totals: [{ $group: { _id: null, orders: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
      collected: { $sum: { $cond: [collected, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      revenue: { $sum: { $cond: [collected, '$amount', 0] } }, ordered_value: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$amount', 0] } } } }, { $project: { _id: 0 } }],
    daily: [{ $group: { _id: { $substrBytes: ['$created_at', 0, 10] }, orders: { $sum: 1 }, collected: { $sum: { $cond: [collected, 1, 0] } },
      revenue: { $sum: { $cond: [collected, '$amount', 0] } }, ordered_value: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$amount', 0] } } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: '$_id', orders: 1, collected: 1, revenue: { $round: ['$revenue', 2] }, ordered_value: { $round: ['$ordered_value', 2] } } }],
    statuses: [{ $group: { _id: '$status', value: { $sum: 1 } } }, { $project: { _id: 0, name: '$_id', value: 1 } }],
    hourly: [{ $group: { _id: { weekday: { $dayOfWeek: { $toDate: '$created_at' } }, hour: { $hour: { $toDate: '$created_at' } } }, orders: { $sum: 1 }, revenue: { $sum: { $cond: [collected, '$amount', 0] } } } },
      { $project: { _id: 0, weekday: { $mod: [{ $add: ['$_id.weekday', 5] }, 7] }, hour: '$_id.hour', orders: 1, revenue: { $round: ['$revenue', 2] } } }],
    categories: [
      { $match: { $expr: collected } }, { $unwind: '$items' }, { $match: { 'items.fulfillment_status': { $ne: 'cancelled' } } },
      { $lookup: { from: 'products', localField: 'items.product_id', foreignField: 'id', as: 'product' } },
      { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$product.category', 0] }, 'Other'] }, value: { $sum: { $ifNull: ['$items.total_price', { $multiply: ['$items.price_at_purchase', '$items.quantity'] }] } } } },
      { $sort: { value: -1, _id: 1 } }, { $project: { _id: 0, name: '$_id', value: { $round: ['$value', 2] } } },
    ],
    products: [
      { $match: { $expr: collected } }, { $unwind: '$items' }, { $match: { 'items.fulfillment_status': { $ne: 'cancelled' } } },
      { $group: { _id: '$items.product_id', name: { $first: '$items.product_name' }, units: { $sum: '$items.quantity' }, value: { $sum: { $ifNull: ['$items.total_price', { $multiply: ['$items.price_at_purchase', '$items.quantity'] }] } } } },
      { $sort: { value: -1, _id: 1 } }, { $limit: 6 }, { $lookup: { from: 'products', localField: '_id', foreignField: 'id', as: 'product' } },
      { $project: { _id: 0, id: '$_id', name: { $ifNull: ['$name', { $ifNull: [{ $arrayElemAt: ['$product.name', 0] }, 'Archived product'] }] }, units: 1, value: { $round: ['$value', 2] } } },
    ],
  } });
  const productScope = scope === 'vendor' ? { vendor_id: user.id } : {};
  const [reports, catalog, vendors] = await Promise.all([
    db.collection(scope === 'vendor' ? 'order_items' : 'orders').aggregate(pipeline, { maxTimeMS: 15000 }).toArray(),
    db.collection('products').aggregate([{ $match: { ...productScope, status: { $nin: ['deleted', 'deleted_by_admin'] }, description: { $not: /"status"\s*:\s*"deleted_by_admin"/ } } },
      { $group: { _id: null, total: { $sum: 1 }, published: { $sum: { $cond: ['$is_active', 1, 0] } }, in_stock: { $sum: { $cond: [{ $and: ['$is_active', { $gt: ['$stock', 0] }] }, 1, 0] } }, low_stock: { $sum: { $cond: [{ $and: ['$is_active', { $lte: ['$stock', 3] }] }, 1, 0] } } } }, { $project: { _id: 0 } }]).toArray(),
    scope === 'admin' ? db.collection('users').aggregate([{ $match: { role: 'vendor' } }, { $group: { _id: null, total: { $sum: 1 }, approved: { $sum: { $cond: [{ $and: [{ $eq: ['$vendor_status', 'approved'] }, { $ne: ['$disabled', true] }] }, 1, 0] } } } }, { $project: { _id: 0 } }]).toArray() : [],
  ]);
  const report = reports[0] || {};
  const totals = report.totals?.[0] || { orders: 0, delivered: 0, collected: 0, cancelled: 0, revenue: 0, ordered_value: 0 };
  totals.revenue = Math.round(totals.revenue * 100) / 100;
  totals.ordered_value = Math.round(totals.ordered_value * 100) / 100;
  return { scope, days, start: start.toISOString().slice(0, 10), end: new Date(end.getTime() - 86400000).toISOString().slice(0, 10), generated_at: now.toISOString(),
    totals, daily: report.daily || [], hourly: report.hourly || [], statuses: report.statuses || [], categories: report.categories || [], products: report.products || [],
    catalog: catalog[0] || { total: 0, published: 0, in_stock: 0, low_stock: 0 }, vendors: vendors[0] || null };
}
