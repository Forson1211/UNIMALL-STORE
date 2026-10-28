import { approved, cents, fail, text } from './security.mjs';

// Use stored line totals for discounted orders; older orders only have a unit price.
export const lineCents = line => Number.isFinite(line.total_price) ? cents(line.total_price) : cents(line.price_at_purchase) * line.quantity;
export const lineTotalExpression = { $ifNull: ['$total_price', { $multiply: ['$price_at_purchase', '$quantity'] }] };

export async function quoteCart(db, items, couponCode, session) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 100 || items.some(item => !item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) || new Set(items.map(item => item.id)).size !== items.length) fail(400, 'Choose between 1 and 100 different products with valid quantities.');
  const now = new Date().toISOString();
  const productIds = items.map(item => item.id);
  const products = await db.collection('products').find({ id: { $in: productIds }, is_active: true }, { session }).toArray();
  const sellerIds = [...new Set(products.map(product => product.vendor_id))];
  // Batch independent reads to avoid one database round trip per cart line.
  // MongoDB transaction operations must remain sequential on their shared session.
  const sellers = await db.collection('users').find({ id: { $in: sellerIds } }, { session, projection: { id: 1, role: 1, vendor_status: 1, disabled: 1 } }).toArray();
  const activeDeals = await db.collection('deals').find({ product_id: { $in: productIds }, approved_by_admin: true, rejected_at: null, start_time: { $lte: now }, end_time: { $gt: now } }, { session }).toArray();
  const productMap = new Map(products.map(product => [product.id, product]));
  const sellerMap = new Map(sellers.map(seller => [seller.id, seller]));
  const lines = [];
  for (const item of [...items].sort((a, b) => a.id.localeCompare(b.id))) {
    const product = productMap.get(item.id);
    if (!product) fail(409, 'A product is no longer available. Remove it from your cart.');
    const seller = sellerMap.get(product.vendor_id);
    if (!approved(seller)) fail(409, `${product.name} is unavailable.`);
    const base = cents(product.price);
    if (base <= 0 || !Number.isInteger(product.stock) || product.stock < item.quantity) fail(409, `Not enough available stock for ${product.name}.`);
    const deals = activeDeals.filter(deal => deal.product_id === product.id && deal.vendor_id === product.vendor_id);
    const prices = deals.filter(deal => Number.isFinite(deal.discount_price) && deal.discount_price > 0).map(deal => cents(deal.discount_price));
    const unit = Math.min(base, ...prices);
    lines.push({ id: product.id, vendor_id: product.vendor_id, name: product.name, image: product.image_url,
      quantity: item.quantity, price: unit / 100, base_price: base / 100, subtotal: unit * item.quantity / 100, discount: 0, total: unit * item.quantity / 100, stock: product.stock });
  }
  const subtotal = lines.reduce((sum, line) => sum + cents(line.subtotal), 0);
  let coupon = null, discount = 0;
  if (couponCode) {
    const code = text(couponCode, 'coupon code', 2, 40).toUpperCase();
    coupon = await db.collection('coupons').findOne({ code }, { session });
    const owner = coupon && (sellerMap.get(coupon.created_by) || await db.collection('users').findOne({ id: coupon.created_by }, { session }));
    if (!coupon || !owner || owner.disabled || coupon.status !== 'active' || (coupon.start_date && coupon.start_date > now) || (coupon.end_date && coupon.end_date <= now) || (coupon.usage_limit != null && (coupon.usage_count || 0) >= coupon.usage_limit)) fail(400, 'This coupon is invalid, expired or fully used.');
    const platform = coupon.scope === 'platform' || (!coupon.scope && ['admin', 'moderator'].includes(owner.role));
    if (!platform && !approved(owner)) fail(400, 'This coupon is unavailable.');
    const eligible = lines.filter(line => platform || line.vendor_id === coupon.created_by);
    const eligibleTotal = eligible.reduce((sum, line) => sum + cents(line.subtotal), 0);
    if (!eligibleTotal) fail(400, 'This coupon applies only to products from its store.');
    if (!Number.isFinite(coupon.discount_value) || coupon.discount_value <= 0 || !['percentage', 'fixed_amount'].includes(coupon.discount_type)) fail(400, 'This coupon is unavailable.');
    discount = Math.min(eligibleTotal, coupon.discount_type === 'percentage' ? Math.round(eligibleTotal * Math.min(coupon.discount_value, 100) / 100) : cents(coupon.discount_value));
    // Proportional allocation with deterministic remainder handling keeps every pesewa accounted for.
    const allocations = eligible.map(line => ({ line, exact: discount * cents(line.subtotal) / eligibleTotal, amount: Math.floor(discount * cents(line.subtotal) / eligibleTotal) }));
    let remainder = discount - allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    allocations.sort((a, b) => (b.exact - b.amount) - (a.exact - a.amount) || a.line.id.localeCompare(b.line.id));
    for (const allocation of allocations) {
      if (remainder > 0) { allocation.amount++; remainder--; }
      allocation.line.discount = allocation.amount / 100;
      allocation.line.total = (cents(allocation.line.subtotal) - allocation.amount) / 100;
    }
  }
  return { items: lines, subtotal: subtotal / 100, discount: discount / 100, total: (subtotal - discount) / 100,
    coupon_code: coupon?.code || null, coupon_id: coupon?.id || null };
}
