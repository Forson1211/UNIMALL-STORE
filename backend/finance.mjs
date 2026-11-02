import { checkout } from './commerce.mjs';
import { transact } from './db.mjs';
import { approved, digest, fail, hasRole, identity, text, timestamp } from './security.mjs';
import { account, admin, balance, credit, debit, encrypt, financeAudit, financeSettings, fridayCutoff, id, ledger, money, notice, postings, queue, reauthenticate, seller, serialize } from './finance-model.mjs';
import { paymentGate, providerCredentials } from './paystack.mjs';

const one = async (db, collection, filter, session) => db.collection(collection).findOne(filter, { session });
const rows = async (db, collection, filter = {}, session) => db.collection(collection).find(filter, { session }).toArray();
const save = (db, collection, entityId, values, session) => db.collection(collection).updateOne({ id: entityId }, { $set: { ...values, updated_at: timestamp() }, $inc: { version: 1 } }, { session });
export const safePayment = p => ({ id: p.id, order_id: p.order_id, reference: p.reference, status: p.status, amount_pesewas: p.amount_pesewas, currency: p.currency, authorization_url: p.authorization_url || null, exception: p.exception || null });
const tx = (ctx, work) => transact(ctx.client, async session => {
  await serialize(ctx.db, session);
  if (ctx.user) {
    // Conflict with concurrent role, password or suspension changes before committing money actions.
    const current = await one(ctx.db, 'users', { id: ctx.user.id }, session);
    if (!current || current.disabled || current.role !== ctx.user.role || current.vendor_status !== ctx.user.vendor_status || current.password_hash !== ctx.user.password_hash) fail(403, 'Your account changed. Sign in again before continuing.');
    await ctx.db.collection('users').updateOne({ id: current.id }, { $inc: { commerce_version: 1 } }, { session });
  }
  return work(session);
});
const mode = ctx => ctx.config.paystackTestMode ? 'test' : 'live';
function validateProvider(ctx, data, entity, transfer = false) {
  if (!data || !['string', 'number'].includes(typeof data.id) || !String(data.id).length) fail(409, 'The provider response is missing its transaction ID.');
  const recipient = typeof data.recipient === 'object' ? data.recipient?.recipient_code : null;
  if (data.reference !== (transfer ? entity.transfer_reference : entity.reference) || data.currency !== 'GHS' || data.amount !== entity.amount_pesewas || data.domain !== mode(ctx)
    || (ctx.config.paystackIntegrationId && String(typeof data.integration === 'object' ? data.integration?.id : data.integration) !== String(ctx.config.paystackIntegrationId))
    || (transfer && recipient !== entity.recipient_code)) fail(409, 'Provider ownership, amount, recipient, mode or currency verification failed.', 'RECONCILIATION_REQUIRED');
  if (!transfer && (data.metadata?.order_id !== entity.order_id || data.metadata?.payment_id !== entity.id)) fail(409, 'Payment metadata does not match this order.');
}
async function hold(db, line, session) {
  return !!(await one(db, 'disputes', { order_item_id: line.order_item_id || line.id, status: 'open' }, session)
    || await one(db, 'refunds', { order_item_id: line.order_item_id || line.id, status: { $in: ['queued', 'submitted', 'pending', 'processing', 'reconciliation_required'] } }, session));
}
async function discrepancy(ctx, kind, entityId, message) {
  const key = `${kind}:${entityId}`;
  await ctx.db.collection('provider_reconciliations').updateOne({ id: key }, { $set: { status: 'open', kind, entity_id: entityId, message, updated_at: timestamp() }, $setOnInsert: { created_at: timestamp() } }, { upsert: true });
}
async function matched(ctx, kind, entityId, session) {
  await ctx.db.collection('provider_reconciliations').updateOne({ id: `${kind}:${entityId}`, status: 'open' }, { $set: { status: 'matched', resolved_at: timestamp(), resolution: 'Provider verification completed' } }, { session });
}
async function reconcileFee(ctx, session, entity, actual, expense, key) {
  money(actual, 'actual provider fee');
  const previous = entity.fees_pesewas || 0, difference = actual - previous;
  if (!difference) return;
  const lines = difference > 0 ? [debit(expense, difference), credit('provider_cash', difference)] : [debit('provider_cash', -difference), credit(expense, -difference)];
  await ledger(ctx.db, session, `${key}:${entity.id}:${entity.version || 0}:${actual}`, lines, { provider_fee_reconciliation: true, previous_pesewas: previous, actual_pesewas: actual });
}
async function updateBatch(ctx, session, batchId) {
  if (!batchId) return;
  const payouts = await rows(ctx.db, 'payouts', { batch_id: batchId }, session);
  const terminal = payouts.filter(p => ['successful', 'failed', 'cancelled'].includes(p.status));
  const status = payouts.some(p => p.status === 'awaiting_approval') ? 'awaiting_approval' : terminal.length === payouts.length ? payouts.every(p => p.status === 'successful') ? 'completed' : 'completed_with_exceptions' : 'processing';
  await save(ctx.db, 'payout_batches', batchId, { status, successful_pesewas: payouts.filter(p => p.status === 'successful').reduce((s, p) => s + p.amount_pesewas, 0), fees_pesewas: payouts.reduce((s, p) => s + (p.fee_pesewas || 0), 0) }, session);
}

export async function createCheckout(ctx, input) {
  const buyer = identity(ctx.user), method = input.payment_method || 'paystack';
  if (!['paystack', 'cod'].includes(method)) fail(400, 'Choose Paystack or cash on delivery.');
  if (method === 'paystack') paymentGate(ctx.config);
  const settings = await financeSettings(ctx.db, ctx.config);
  const orderId = await checkout({ ...ctx, finance: { settings } }, { _buyer_id: buyer, _request_id: text(input.request_id, 'request ID', 8, 128),
    _items: input.items, _shipping_details: input.shipping_details, _coupon_code: input.coupon_code, _payment_method: method });
  let payment = await one(ctx.db, 'payments', { order_id: orderId });
  if (!payment) fail(409, 'This request belongs to a historical checkout. Start a new checkout request.');
  if (payment.provider !== method && !(method === 'paystack' && payment.provider === 'paystack')) fail(409, 'This checkout request already uses another payment method.');
  if (payment.provider === 'cod') return { order_id: orderId, payment: safePayment(payment) };
  const initialize = await tx(ctx, async session => {
    payment = await one(ctx.db, 'payments', { id: payment.id }, session);
    if (payment.status !== 'initiated') return false;
    if (payment.amount_pesewas <= 0) fail(400, 'Online checkout requires a positive total.');
    await save(ctx.db, 'payments', payment.id, { status: 'initializing' }, session);
    return true;
  });
  if (initialize) {
    try {
      const authorization = await ctx.provider.initialize(payment, ctx.user.email);
      if (typeof authorization.authorization_url !== 'string' || new URL(authorization.authorization_url).hostname !== 'checkout.paystack.com' || !authorization.authorization_url.startsWith('https://')) fail(502, 'The provider returned an invalid checkout URL.');
      await ctx.db.collection('payments').updateOne({ id: payment.id, status: 'initializing' }, { $set: { status: 'pending', authorization_url: authorization.authorization_url, updated_at: timestamp() } });
    } catch {
      await ctx.db.collection('payments').updateOne({ id: payment.id, status: 'initializing' }, { $set: { status: 'reconciliation_required' } });
      await discrepancy(ctx, 'payment', payment.id, 'Checkout initialization response was unavailable. Verify the saved reference before retrying.');
    }
  }
  payment = await one(ctx.db, 'payments', { id: payment.id });
  return { order_id: orderId, payment: safePayment(payment) };
}

export async function verifyPayment(ctx, paymentId) {
  let payment = await one(ctx.db, 'payments', { id: paymentId, provider: 'paystack' });
  if (!payment) fail(404, 'Online payment not found.');
  const data = await ctx.provider.verifyPayment(payment.reference);
  validateProvider(ctx, data, payment);
  if (data.status !== 'success') {
    if (payment.credited_at && ['reversed', 'failed'].includes(data.status)) await discrepancy(ctx, 'payment_reversal', payment.id, 'Previously credited payment now has a conflicting provider status. Transfers are held for provider dispute/refund review.');
    if (['failed', 'abandoned', 'reversed'].includes(data.status) && !payment.credited_at) await expirePayment(ctx, payment.id, true);
    return safePayment(await one(ctx.db, 'payments', { id: payment.id }));
  }
  money(data.fees || 0, 'provider processing fee');
  return tx(ctx, async session => {
    payment = await one(ctx.db, 'payments', { id: paymentId }, session);
    if (payment.credited_at) {
      await reconcileFee(ctx, session, payment, data.fees || 0, 'processing_expense', 'processing-fee-adjustment');
      if ((payment.fees_pesewas || 0) !== (data.fees || 0)) await save(ctx.db, 'payments', payment.id, { fees_pesewas: data.fees || 0 }, session);
      await matched(ctx, 'payment', payment.id, session);
      return safePayment(payment);
    }
    const order = await one(ctx.db, 'orders', { id: payment.order_id }, session);
    const items = await rows(ctx.db, 'order_items', { order_id: order.id }, session);
    const late = order.status === 'cancelled' || items.some(i => i.stock_released || i.fulfillment_status === 'cancelled');
    const lines = [debit('provider_cash', payment.amount_pesewas)];
    if (late) lines.push(credit('refund_payable', payment.amount_pesewas));
    else {
      for (const item of items) {
        lines.push(credit(account('vendor_pending', item.vendor_id), item.entitlement_pesewas), credit('deferred_commission', item.commission_pesewas));
        await ctx.db.collection('vendor_earnings').insertOne({ id: id(), order_item_id: item.id, order_id: order.id, vendor_id: item.vendor_id, payment_id: payment.id,
          currency: 'GHS', gross_pesewas: item.gross_pesewas, commission_bps: item.commission_bps, commission_pesewas: item.commission_pesewas,
          entitlement_pesewas: item.entitlement_pesewas, remaining_pesewas: item.entitlement_pesewas, refunded_pesewas: 0, refunded_commission_pesewas: 0,
          buyer_confirmed_at: item.buyer_confirmed_at || null, eligible_at: item.eligible_at || null, status: 'pending', created_at: timestamp(), version: 1 }, { session });
        await notice(ctx.db, session, item.vendor_id, 'Payment verified', 'A buyer payment was verified. Earnings remain pending until confirmed delivery and the waiting period pass.');
      }
      lines.push(credit('delivery_payable', order.delivery_pesewas || 0), credit('tax_payable', order.tax_pesewas || 0));
    }
    await ledger(ctx.db, session, 'collection:' + payment.id, postings(lines), { payment_id: payment.id, order_id: order.id });
    if (data.fees) await ledger(ctx.db, session, 'processing-fee:' + payment.id, [debit('processing_expense', data.fees), credit('provider_cash', data.fees)], { payment_id: payment.id });
    await save(ctx.db, 'payments', payment.id, { status: 'successful', credited_at: timestamp(), provider_id: String(data.id), fees_pesewas: data.fees || 0, exception: late ? 'late_payment_refund' : null }, session);
    await matched(ctx, 'payment', payment.id, session);
    await save(ctx.db, 'orders', order.id, { payment_status: 'successful' }, session);
    await ctx.db.collection('transactions').updateMany({ reference_id: order.id, type: 'payment' }, { $set: { status: 'completed' } }, { session });
    if (late) {
      const refund = { id: id(), currency: 'GHS', mode: mode(ctx), request_id: 'late:' + payment.id, payment_id: payment.id, order_id: order.id, vendor_id: null, order_item_id: null,
        amount_pesewas: payment.amount_pesewas, commission_pesewas: 0, vendor_pesewas: 0, status: 'queued', reason: 'Payment arrived after stock release', created_at: timestamp() };
      await ctx.db.collection('refunds').insertOne(refund, { session });
      await queue(ctx.db, session, 'refund:' + refund.id, 'refund', refund.id);
    }
    await notice(ctx.db, session, order.buyer_id, 'Payment verified', late ? 'Payment arrived after cancellation. A refund is queued for provider processing.' : 'Your payment is verified. Delivery is still pending.', '/account/orders?order=' + order.id);
    return safePayment({ ...payment, status: 'successful', credited_at: timestamp(), exception: late ? 'late_payment_refund' : null });
  });
}

export async function expirePayment(ctx, paymentId, failed = false) {
  return tx(ctx, async session => {
    const payment = await one(ctx.db, 'payments', { id: paymentId, provider: 'paystack' }, session);
    if (!payment || payment.credited_at || (!failed && payment.expires_at > timestamp())) return;
    const order = await one(ctx.db, 'orders', { id: payment.order_id }, session);
    for (const line of await rows(ctx.db, 'order_items', { order_id: order.id }, session)) {
      if (!line.stock_released) {
        if (!['pending', 'confirmed', 'cancelled'].includes(line.fulfillment_status)) fail(409, 'Dispatched inventory cannot be released.');
        await ctx.db.collection('products').updateOne({ id: line.product_id }, { $inc: { stock: line.quantity } }, { session });
        await save(ctx.db, 'order_items', line.id, { stock_released: true, fulfillment_status: 'cancelled' }, session);
      }
    }
    await save(ctx.db, 'payments', payment.id, { status: 'failed', expired_at: timestamp() }, session);
    await save(ctx.db, 'orders', order.id, { status: 'cancelled', payment_status: 'failed' }, session);
  });
}

export async function confirmDelivery(ctx, lineId, input = {}) {
  identity(ctx.user);
  return tx(ctx, async session => {
    const line = await one(ctx.db, 'order_items', { id: lineId }, session), order = line && await one(ctx.db, 'orders', { id: line.order_id, buyer_id: ctx.user.id }, session);
    if (!order || !line.finance_version) fail(404, 'Financial order item not found in your account.');
    if (line.fulfillment_status !== 'delivered' || !line.vendor_delivered_at) fail(409, 'The seller must record delivery first.');
    if (line.buyer_confirmed_at) {
      if (order.payment_method === 'cod' && input.cash_paid === true && !line.buyer_cash_confirmed_at) {
        await save(ctx.db, 'order_items', line.id, { buyer_cash_confirmed_at: timestamp() }, session);
        await financeAudit(ctx.db, session, ctx.user, 'Buyer confirmed COD cash payment', { order_item_id: line.id });
      }
      return true;
    }
    const settings = await financeSettings(ctx.db, ctx.config, session);
    const values = { buyer_confirmed_at: timestamp(), eligible_at: new Date(Date.now() + settings.waiting_hours * 3600000).toISOString(), ...(input.cash_paid === true ? { buyer_cash_confirmed_at: timestamp() } : {}) };
    await save(ctx.db, 'order_items', line.id, values, session);
    await ctx.db.collection('vendor_earnings').updateOne({ order_item_id: line.id }, { $set: values }, { session });
    await financeAudit(ctx.db, session, ctx.user, 'Buyer confirmed delivery', { order_item_id: line.id });
    await notice(ctx.db, session, line.vendor_id, 'Buyer confirmed delivery', 'The delivery waiting period has started. Open disputes or refunds will hold eligibility.');
    return true;
  });
}
export async function confirmCodVendor(ctx, orderId) {
  seller(ctx.user);
  return tx(ctx, async session => {
    const order = await one(ctx.db, 'orders', { id: orderId, payment_method: 'cod', finance_version: 1 }, session);
    const items = await rows(ctx.db, 'order_items', { order_id: orderId, vendor_id: ctx.user.id }, session);
    if (!order || !items.length || items.some(i => i.fulfillment_status !== 'delivered')) fail(409, 'Only your delivered COD items can be confirmed.');
    for (const item of items) await save(ctx.db, 'order_items', item.id, { vendor_cash_confirmed_at: timestamp() }, session);
    await financeAudit(ctx.db, session, ctx.user, 'Seller confirmed COD cash receipt', { order_id: order.id });
    return true;
  });
}
export async function collectCod(ctx, orderId) {
  if (!hasRole(ctx.user, 'admin', 'super_admin', 'order_manager')) fail(403, 'Only order staff may record confirmed COD collection.');
  return tx(ctx, async session => {
    const order = await one(ctx.db, 'orders', { id: orderId, finance_version: 1, payment_method: 'cod' }, session);
    if (!order) fail(409, 'This requires a new COD order; reconcile historical orders separately.');
    const items = (await rows(ctx.db, 'order_items', { order_id: order.id }, session)).filter(i => i.fulfillment_status !== 'cancelled');
    if (!items.length || items.some(i => !i.vendor_cash_confirmed_at || !i.buyer_cash_confirmed_at || !i.buyer_confirmed_at || i.fulfillment_status !== 'delivered')) fail(409, 'Buyer delivery/payment confirmation and seller cash confirmation are required.');
    for (const item of items) {
      if (item.cod_commission_status) continue;
      if (item.commission_pesewas) await ledger(ctx.db, session, 'cod:' + item.id, postings([debit(account('cod_receivable', item.vendor_id), item.commission_pesewas), credit('commission_revenue', item.commission_pesewas)]), { order_item_id: item.id });
      await save(ctx.db, 'order_items', item.id, { cod_commission_status: item.commission_pesewas ? 'owed' : 'not_due' }, session);
    }
    await save(ctx.db, 'orders', order.id, { payment_status: 'successful' }, session);
    await ctx.db.collection('payments').updateOne({ order_id: order.id, provider: 'cod' }, { $set: { status: 'successful', confirmed_at: timestamp() } }, { session });
    await financeAudit(ctx.db, session, ctx.user, 'Verified COD collection; commission receivable recorded', { order_id: order.id });
    return true;
  });
}

export async function releaseEligible(ctx, now = new Date()) {
  return tx(ctx, async session => {
    const candidates = await ctx.db.collection('vendor_earnings').find({ status: 'pending', eligible_at: { $lte: now.toISOString() } }, { session }).limit(200).toArray();
    let count = 0;
    for (const e of candidates) {
      const vendor = await one(ctx.db, 'users', { id: e.vendor_id }, session);
      if (!e.buyer_confirmed_at || !approved(vendor) || await hold(ctx.db, e, session)) continue;
      await ctx.db.collection('users').updateOne({ id: vendor.id }, { $inc: { commerce_version: 1 } }, { session });
      const fee = e.commission_pesewas - (e.refunded_commission_pesewas || 0);
      const lines = postings([debit(account('vendor_pending', e.vendor_id), e.remaining_pesewas), credit(account('vendor_available', e.vendor_id), e.remaining_pesewas), debit('deferred_commission', fee), credit('commission_revenue', fee)]);
      if (lines.length) await ledger(ctx.db, session, 'eligible:' + e.id, lines, { earning_id: e.id });
      await save(ctx.db, 'vendor_earnings', e.id, { status: 'eligible', recognized_at: timestamp() }, session);
      count++;
    }
    return count;
  });
}

export async function setPayoutAccount(ctx, input) {
  seller(ctx.user); paymentGate(ctx.config); await reauthenticate(ctx.user, input.password);
  const type = input.type;
  if (!['ghipss', 'mobile_money'].includes(type)) fail(400, 'Choose a verified Ghana bank or mobile money recipient type.');
  const details = { type, name: text(input.name, 'account holder', 2, 120), account_number: text(input.account_number, 'account number', 5, 30), bank_code: text(input.bank_code, 'provider bank/network code', 2, 20) };
  // Encrypt before transmitting, so missing local encryption cannot leave a usable half-configured destination.
  const encrypted = encrypt(details, ctx.config), identityHash = digest(details.type + ':' + details.bank_code + ':' + details.account_number);
  const response = await ctx.provider.createRecipient(details);
  if (response.active !== true || response.currency !== 'GHS' || !response.recipient_code || response.details?.account_number !== details.account_number || response.details?.bank_code !== details.bank_code || !response.details?.account_name) fail(409, 'The provider has not verified this recipient.');
  return tx(ctx, async session => {
    if ((await rows(ctx.db, 'payouts', { vendor_id: ctx.user.id, status: { $in: ['awaiting_approval', 'approved', 'queued', 'submitted', 'processing', 'reconciliation_required'] } }, session)).length) fail(409, 'Resolve reserved payouts before changing the destination.');
    const existing = await one(ctx.db, 'payout_accounts', { vendor_id: ctx.user.id }, session);
    const duplicate = await one(ctx.db, 'payout_accounts', { provider: 'paystack', identity_hash: identityHash }, session);
    if (duplicate && duplicate.vendor_id !== ctx.user.id) fail(409, 'This payout identity belongs to another seller.');
    const values = { vendor_id: ctx.user.id, provider: 'paystack', identity_hash: identityHash, recipient_code: response.recipient_code, type, masked_account: '••••' + details.account_number.slice(-4), account_name: response.details.account_name, encrypted_details: encrypted, verified_at: timestamp(), mode: mode(ctx), updated_at: timestamp(), version: (existing?.version || 0) + 1 };
    await ctx.db.collection('payout_accounts').updateOne({ vendor_id: ctx.user.id }, { $set: values, $setOnInsert: { id: id(), created_at: timestamp() } }, { session, upsert: true });
    await financeAudit(ctx.db, session, ctx.user, 'Verified payout destination changed', { masked_account: values.masked_account });
    await notice(ctx.db, session, ctx.user.id, 'Payout account changed', 'Your verified payout destination was updated. Contact support immediately if this was not you.');
    return { masked_account: values.masked_account, account_name: values.account_name, verified_at: values.verified_at };
  });
}

export async function createBatch(ctx, now = new Date()) {
  const cutoff = fridayCutoff(now);
  await releaseEligible(ctx, now);
  return tx(ctx, async session => {
    const previous = await one(ctx.db, 'payout_batches', { schedule_key: cutoff.key }, session);
    if (previous) return previous;
    const settings = await financeSettings(ctx.db, ctx.config, session);
    const batch = { id: id(), schedule_key: cutoff.key, cutoff_at: cutoff.at, status: 'awaiting_approval', currency: 'GHS', amount_pesewas: 0, created_at: timestamp(), created_by: ctx.user?.id || 'finance-worker', version: 1 };
    const candidates = await rows(ctx.db, 'vendor_earnings', { status: 'eligible', eligible_at: { $lte: cutoff.at } }, session);
    for (const vendorId of [...new Set(candidates.map(e => e.vendor_id))].sort()) {
      const vendor = await one(ctx.db, 'users', { id: vendorId }, session), recipient = await one(ctx.db, 'payout_accounts', { vendor_id: vendorId, mode: mode(ctx) }, session);
      if (!approved(vendor) || !recipient?.verified_at || await balance(ctx.db, account('vendor_debt', vendorId), session, true) > 0) continue;
      // COD offsets are deliberately disabled. They require a separately reviewed contractual implementation.
      const eligible = [];
      for (const e of candidates.filter(row => row.vendor_id === vendorId)) if (!await hold(ctx.db, e, session)) eligible.push(e);
      const amount = eligible.reduce((sum, e) => sum + e.remaining_pesewas, 0);
      if (!amount || amount < settings.minimum_payout_pesewas) continue;
      const payout = { id: id(), provider: 'paystack', batch_id: batch.id, vendor_id: vendorId, currency: 'GHS', amount_pesewas: amount, recipient_code: recipient.recipient_code,
        masked_account: recipient.masked_account, account_version: recipient.version, mode: mode(ctx), estimated_fee_pesewas: settings.estimated_transfer_fee_pesewas, fee_bearer: 'platform', transfer_reference: 'uni_p_' + id().replaceAll('-', ''), status: 'awaiting_approval', created_at: timestamp(), version: 1 };
      await ctx.db.collection('payouts').insertOne(payout, { session });
      for (const e of eligible) await save(ctx.db, 'vendor_earnings', e.id, { status: 'reserved', payout_id: payout.id }, session);
      await ledger(ctx.db, session, 'reserve:' + payout.id, [debit(account('vendor_available', vendorId), amount), credit(account('vendor_reserved', vendorId), amount)], { payout_id: payout.id });
      batch.amount_pesewas += amount;
      await notice(ctx.db, session, vendorId, 'Friday payout reserved', 'Eligible earnings are reserved for administrator review. Reserved is not paid.');
    }
    await ctx.db.collection('payout_batches').insertOne(batch, { session });
    await financeAudit(ctx.db, session, ctx.user, 'Friday payout batch created', { batch_id: batch.id, schedule_key: batch.schedule_key, amount_pesewas: batch.amount_pesewas });
    for (const a of await rows(ctx.db, 'users', { role: { $in: ['admin', 'super_admin'] }, disabled: { $ne: true } }, session)) await notice(ctx.db, session, a.id, 'Friday batch needs review', 'Review and approve the eligible vendor payout batch.', '/admin/finance');
    return batch;
  });
}
async function payoutSafety(ctx, p, session) {
  const vendor = await one(ctx.db, 'users', { id: p.vendor_id }, session), recipient = await one(ctx.db, 'payout_accounts', { vendor_id: p.vendor_id }, session);
  if (!approved(vendor) || recipient?.version !== p.account_version || recipient.recipient_code !== p.recipient_code || p.mode !== mode(ctx)) fail(409, 'The vendor or payout destination changed. Cancel and review this payout.');
  await ctx.db.collection('users').updateOne({ id: vendor.id }, { $inc: { commerce_version: 1 } }, { session });
  if (await balance(ctx.db, account('vendor_debt', p.vendor_id), session, true) > 0) fail(409, 'An unpaid vendor refund debt holds this payout.');
  for (const e of await rows(ctx.db, 'vendor_earnings', { payout_id: p.id }, session)) if (await hold(ctx.db, e, session)) fail(409, 'An open dispute or refund holds this payout.');
}
export async function approveBatch(ctx, batchId, input) {
  admin(ctx.user); paymentGate(ctx.config, true); await reauthenticate(ctx.user, input.password);
  return tx(ctx, async session => {
    const batch = await one(ctx.db, 'payout_batches', { id: batchId }, session);
    if (!batch) fail(404, 'Batch not found.');
    if (batch.status !== 'awaiting_approval') return batch;
    for (const p of await rows(ctx.db, 'payouts', { batch_id: batch.id, status: 'awaiting_approval' }, session)) {
      await payoutSafety(ctx, p, session);
      await save(ctx.db, 'payouts', p.id, { status: 'queued', approved_by: ctx.user.id, approved_at: timestamp() }, session);
      await queue(ctx.db, session, 'transfer:' + p.id, 'transfer', p.id);
      await notice(ctx.db, session, p.vendor_id, 'Payout approved', 'Your payout is queued for provider processing.');
    }
    await save(ctx.db, 'payout_batches', batch.id, { status: 'approved', approved_by: ctx.user.id, approved_at: timestamp() }, session);
    await financeAudit(ctx.db, session, ctx.user, 'Payout batch approved', { batch_id: batch.id, amount_pesewas: batch.amount_pesewas });
    return { ...batch, status: 'approved' };
  });
}

export async function settleTransfer(ctx, payoutId, verified) {
  const payout = await one(ctx.db, 'payouts', { id: payoutId }); if (!payout) fail(404, 'Payout not found.');
  const data = verified || await ctx.provider.verifyTransfer(payout.transfer_reference);
  validateProvider(ctx, data, payout, true);
  return tx(ctx, async session => {
    const p = await one(ctx.db, 'payouts', { id: payout.id }, session);
    if (p.status === 'failed' && ['failed', 'reversed'].includes(data.status)) return p;
    if (!['submitted', 'processing', 'reconciliation_required', 'successful'].includes(p.status)) { await discrepancy(ctx, 'transfer', p.id, 'Provider transfer exists without an active submission.'); return p; }
    if (p.status === 'successful' && data.status === 'success') {
      await reconcileFee(ctx, session, { ...p, fees_pesewas: p.fee_pesewas }, data.fee_charged || 0, 'transfer_expense', 'transfer-fee-adjustment');
      await save(ctx.db, 'payouts', p.id, { fee_pesewas: data.fee_charged || 0 }, session);
      await matched(ctx, 'transfer', p.id, session);
      await updateBatch(ctx, session, p.batch_id);
      return p;
    }
    if (p.status === 'successful' && data.status === 'reversed') {
      await ledger(ctx.db, session, 'transfer-reversal:' + p.id, [debit('provider_cash', p.amount_pesewas), credit(account('vendor_reserved', p.vendor_id), p.amount_pesewas)], { payout_id: p.id });
      await save(ctx.db, 'payouts', p.id, { status: 'reconciliation_required', reversal: true }, session);
      await discrepancy(ctx, 'transfer', p.id, 'Previously settled transfer reversed. Reservation restored; administrator reconciliation required.');
      return;
    }
    if (p.status === 'successful' || p.reversal) {
      await discrepancy(ctx, 'transfer', p.id, 'Conflicting provider status after settlement or reversal requires review. No earnings were released.');
      return p;
    }
    if (data.status === 'success') {
      if (p.reversal) fail(409, 'A reversed transfer requires an administrator decision before any new payout.');
      await ledger(ctx.db, session, 'transfer-settle:' + p.id, [debit(account('vendor_reserved', p.vendor_id), p.amount_pesewas), credit('provider_cash', p.amount_pesewas)], { payout_id: p.id });
      if (data.fee_charged) await ledger(ctx.db, session, 'transfer-fee:' + p.id, [debit('transfer_expense', money(data.fee_charged)), credit('provider_cash', data.fee_charged)], { payout_id: p.id });
      await ctx.db.collection('vendor_earnings').updateMany({ payout_id: p.id }, { $set: { status: 'paid', paid_at: timestamp() } }, { session });
      await save(ctx.db, 'payouts', p.id, { status: 'successful', confirmed_at: timestamp(), provider_id: String(data.id), transfer_code: data.transfer_code, fee_pesewas: data.fee_charged || 0 }, session);
      await notice(ctx.db, session, p.vendor_id, 'Payout completed', 'The payment provider confirmed your payout as successful.');
    } else if (['failed', 'reversed'].includes(data.status)) {
      await releasePayout(ctx, session, p, 'failed');
    } else await save(ctx.db, 'payouts', p.id, { status: 'processing', provider_status: String(data.status).slice(0, 40) }, session);
    if (['success', 'failed', 'reversed'].includes(data.status)) await matched(ctx, 'transfer', p.id, session);
    await updateBatch(ctx, session, p.batch_id);
    await financeAudit(ctx.db, session, null, 'Provider transfer status verified', { payout_id: p.id, provider_status: data.status });
    return one(ctx.db, 'payouts', { id: p.id }, session);
  });
}
async function releasePayout(ctx, session, p, status) {
  await ledger(ctx.db, session, 'release:' + p.id, [debit(account('vendor_reserved', p.vendor_id), p.amount_pesewas), credit(account('vendor_available', p.vendor_id), p.amount_pesewas)], { payout_id: p.id });
  await ctx.db.collection('vendor_earnings').updateMany({ payout_id: p.id }, { $set: { status: 'eligible', payout_id: null } }, { session });
  await save(ctx.db, 'payouts', p.id, { status }, session);
  await notice(ctx.db, session, p.vendor_id, 'Payout ' + status, 'The reserved earnings are available for a future reviewed batch.');
}
export async function cancelPayout(ctx, payoutId, input) {
  admin(ctx.user); await reauthenticate(ctx.user, input.password);
  return tx(ctx, async session => {
    const p = await one(ctx.db, 'payouts', { id: payoutId }, session);
    if (!p || !['awaiting_approval', 'queued', 'approved'].includes(p.status)) fail(409, 'Submitted or unknown transfers must be verified; they cannot be cancelled locally.');
    await releasePayout(ctx, session, p, 'cancelled');
    await updateBatch(ctx, session, p.batch_id);
    await financeAudit(ctx.db, session, ctx.user, 'Unsubmitted payout cancelled', { payout_id: p.id });
    return true;
  });
}
export async function resolveReversedTransfer(ctx, payoutId, input) {
  admin(ctx.user); await reauthenticate(ctx.user, input.password);
  const payout = await one(ctx.db, 'payouts', { id: payoutId });
  if (!payout) fail(404, 'Payout not found.');
  const data = await ctx.provider.verifyTransfer(payout.transfer_reference);
  validateProvider(ctx, data, payout, true);
  if (data.status !== 'reversed') fail(409, 'The provider must confirm the original transfer as reversed.');
  return tx(ctx, async session => {
    const p = await one(ctx.db, 'payouts', { id: payoutId }, session);
    if (p.reversal_resolved_at) return p;
    if (!p.reversal || p.status !== 'reconciliation_required') fail(409, 'Only a previously successful, verified reversed transfer can be restored.');
    await releasePayout(ctx, session, p, 'failed');
    await save(ctx.db, 'payouts', p.id, { reversal: false, reversal_resolved_at: timestamp(), reversal_resolved_by: ctx.user.id }, session);
    await matched(ctx, 'transfer', p.id, session); await updateBatch(ctx, session, p.batch_id);
    await financeAudit(ctx.db, session, ctx.user, 'Verified reversed transfer restored to eligible earnings', { payout_id: p.id });
    return true;
  });
}
async function submitTransfer(ctx, payoutId) {
  paymentGate(ctx.config, true);
  let p = await one(ctx.db, 'payouts', { id: payoutId });
  if (['submitted', 'processing', 'reconciliation_required'].includes(p?.status)) return settleTransfer(ctx, p.id);
  if (p?.status !== 'queued') return;
  const recent = (await rows(ctx.db, 'provider_reconciliations', { kind: 'daily', status: 'matched' })).filter(r => r.created_at >= new Date(Date.now() - 26 * 3600000).toISOString());
  if (!recent.length || await one(ctx.db, 'provider_reconciliations', { status: 'open' })) fail(409, 'A recent matched provider reconciliation is required before transfers.');
  const cash = await ctx.provider.balances(), available = cash.find(b => b.currency === 'GHS')?.balance;
  if (!Number.isSafeInteger(available) || available < p.amount_pesewas + (p.estimated_fee_pesewas || 0)) fail(409, 'Insufficient verified provider balance. The payout remains queued and reserved.');
  p = await tx(ctx, async session => {
    const current = await one(ctx.db, 'payouts', { id: payoutId }, session);
    if (current.status !== 'queued') return null;
    await payoutSafety(ctx, current, session);
    await save(ctx.db, 'payouts', current.id, { status: 'submitted', submitted_at: timestamp() }, session);
    return current;
  });
  if (!p) return;
  try {
    // A successful HTTP response is deliberately not a settlement instruction.
    await ctx.provider.transfer(p);
    await ctx.db.collection('payouts').updateOne({ id: p.id, status: 'submitted' }, { $set: { status: 'processing' } });
  } catch {
    await ctx.db.collection('payouts').updateOne({ id: p.id, status: 'submitted' }, { $set: { status: 'reconciliation_required' } });
    await discrepancy(ctx, 'transfer', p.id, 'Transfer submission response is unknown. Verify this exact reference; never create a replacement transfer.');
  }
}

export async function openDispute(ctx, input) {
  identity(ctx.user);
  return tx(ctx, async session => {
    const line = await one(ctx.db, 'order_items', { id: input.order_item_id }, session), order = line && await one(ctx.db, 'orders', { id: line.order_id, buyer_id: ctx.user.id }, session);
    if (!order || !line.finance_version) fail(404, 'Order item not found.');
    const existing = await one(ctx.db, 'disputes', { order_item_id: line.id, status: 'open' }, session);
    if (existing) return existing;
    const record = { id: id(), order_item_id: line.id, order_id: order.id, vendor_id: line.vendor_id, buyer_id: ctx.user.id, reason: text(input.reason, 'dispute reason', 10, 2000), status: 'open', created_at: timestamp(), version: 1 };
    await ctx.db.collection('disputes').insertOne(record, { session });
    await financeAudit(ctx.db, session, ctx.user, 'Buyer dispute opened', { dispute_id: record.id, order_item_id: line.id });
    await notice(ctx.db, session, line.vendor_id, 'Order disputed', 'A buyer dispute is open. Unsettled earnings are held pending review.');
    return record;
  });
}
export async function resolveDispute(ctx, disputeId, input) {
  admin(ctx.user); await reauthenticate(ctx.user, input.password);
  if (!['seller', 'buyer_refund_required'].includes(input.decision)) fail(400, 'Choose seller or buyer_refund_required.');
  return tx(ctx, async session => {
    const d = await one(ctx.db, 'disputes', { id: disputeId }, session); if (!d) fail(404, 'Dispute not found.');
    if (d.provider_dispute) fail(409, 'Provider chargebacks must first be resolved and documented through the provider reconciliation workflow.');
    await save(ctx.db, 'disputes', d.id, { status: input.decision === 'seller' ? 'resolved' : 'open', decision: input.decision, decision_reason: text(input.reason, 'decision reason', 10, 2000), decided_by: ctx.user.id }, session);
    await financeAudit(ctx.db, session, ctx.user, 'Dispute decision recorded', { dispute_id: d.id, decision: input.decision });
    return true;
  });
}
export async function requestRefund(ctx, input) {
  admin(ctx.user); providerCredentials(ctx.config); await reauthenticate(ctx.user, input.password);
  const amount = money(input.amount_pesewas); if (!amount) fail(400, 'Refund must be positive.');
  const requestId = text(input.request_id, 'refund request ID', 8, 128);
  return tx(ctx, async session => {
    const previous = await one(ctx.db, 'refunds', { request_id: requestId }, session); if (previous) return previous;
    if (input.payment_id && !input.order_item_id) {
      const p = await one(ctx.db, 'payments', { id: input.payment_id, provider: 'paystack' }, session);
      if (!p?.credited_at || p.exception) fail(409, 'Verified, active payment required for delivery/tax refunds.');
      if (await one(ctx.db, 'refunds', { payment_id: p.id, kind: 'order_charges', status: { $in: ['queued', 'submitted', 'pending', 'processing', 'reconciliation_required'] } }, session)) fail(409, 'An earlier delivery/tax refund is unresolved.');
      const order = await one(ctx.db, 'orders', { id: p.order_id }, session);
      const delivery = (order.delivery_pesewas || 0) - (p.delivery_refunded_pesewas || 0), tax = (order.tax_pesewas || 0) - (p.tax_refunded_pesewas || 0);
      if (amount > delivery + tax) fail(400, 'Refund exceeds remaining delivery and tax charges.');
      const record = { id: id(), currency: 'GHS', mode: mode(ctx), request_id: requestId, payment_id: p.id, order_id: p.order_id, order_item_id: null, vendor_id: null, kind: 'order_charges', amount_pesewas: amount, delivery_pesewas: Math.min(amount, delivery), tax_pesewas: Math.max(0, amount - delivery), commission_pesewas: 0, vendor_pesewas: 0, status: 'queued', reason: text(input.reason, 'refund reason', 3, 1000), created_by: ctx.user.id, created_at: timestamp() };
      await ctx.db.collection('refunds').insertOne(record, { session });
      await queue(ctx.db, session, 'refund:' + record.id, 'refund', record.id);
      await financeAudit(ctx.db, session, ctx.user, 'Delivery/tax refund approved', { refund_id: record.id, amount_pesewas: amount });
      return record;
    }
    const e = await one(ctx.db, 'vendor_earnings', { order_item_id: input.order_item_id }, session);
    if (!e) fail(404, 'Verified online earning not found. COD refunds are handled with the cash recipient.');
    if (e.status === 'reserved' || (e.payout_id && await one(ctx.db, 'payouts', { id: e.payout_id, reversal: true }, session))) fail(409, 'Cancel or reconcile the reserved payout before a refund.');
    if (await one(ctx.db, 'refunds', { order_item_id: e.order_item_id, status: { $in: ['queued', 'submitted', 'pending', 'processing', 'reconciliation_required'] } }, session)) fail(409, 'An earlier refund is unresolved.');
    const remainingGross = e.gross_pesewas - e.refunded_pesewas;
    if (amount > remainingGross) fail(400, 'Refund exceeds the unrefunded merchandise amount.');
    const fee = amount === remainingGross ? e.commission_pesewas - e.refunded_commission_pesewas : Number(BigInt(amount) * BigInt(e.commission_pesewas) / BigInt(e.gross_pesewas));
    const record = { id: id(), currency: 'GHS', mode: mode(ctx), request_id: requestId, order_item_id: e.order_item_id, order_id: e.order_id, vendor_id: e.vendor_id, payment_id: e.payment_id, amount_pesewas: amount,
      commission_pesewas: fee, vendor_pesewas: amount - fee, status: 'queued', reason: text(input.reason, 'refund reason', 3, 1000), created_by: ctx.user.id, created_at: timestamp(), version: 1 };
    await ctx.db.collection('refunds').insertOne(record, { session });
    await queue(ctx.db, session, 'refund:' + record.id, 'refund', record.id);
    await financeAudit(ctx.db, session, ctx.user, 'Refund approved for provider processing', { refund_id: record.id, amount_pesewas: amount });
    await notice(ctx.db, session, e.vendor_id, 'Refund queued', 'An itemized refund is queued. Related earnings are held until the provider resolves it.');
    return record;
  });
}
async function submitRefund(ctx, refundId) {
  providerCredentials(ctx.config);
  let r = await one(ctx.db, 'refunds', { id: refundId });
  if (!r || ['processed', 'failed'].includes(r.status)) return;
  if (r.status === 'queued') {
    const claimed = await tx(ctx, async session => {
      const current = await one(ctx.db, 'refunds', { id: r.id }, session);
      if (current.status !== 'queued') return false;
      await save(ctx.db, 'refunds', r.id, { status: 'submitted', submitted_at: timestamp() }, session); return true;
    });
    if (claimed) {
      try {
        const response = await ctx.provider.refund(r, await one(ctx.db, 'payments', { id: r.payment_id }));
        if (!response.id) fail(502, 'Refund response is missing its provider ID.');
        await ctx.db.collection('refunds').updateOne({ id: r.id, status: 'submitted' }, { $set: { provider_id: String(response.id), status: 'pending' } });
      } catch {
        await ctx.db.collection('refunds').updateOne({ id: r.id, status: 'submitted' }, { $set: { status: 'reconciliation_required' } });
        await discrepancy(ctx, 'refund', r.id, 'Refund submission response is unknown. Match the merchant note and provider refund ID; do not submit it again.');
      }
    }
  }
  r = await one(ctx.db, 'refunds', { id: refundId });
  if (r.provider_id) await settleRefund(ctx, r.id);
}
export async function settleRefund(ctx, refundId) {
  const r = await one(ctx.db, 'refunds', { id: refundId }); if (!r?.provider_id) fail(409, 'A verified provider refund ID is required.');
  const data = await ctx.provider.verifyRefund(r.provider_id), payment = await one(ctx.db, 'payments', { id: r.payment_id });
  const reference = typeof data.transaction === 'object' ? data.transaction?.reference : null;
  if (String(data.id) !== r.provider_id || data.amount !== r.amount_pesewas || data.currency !== 'GHS' || (reference !== payment.reference && String(data.transaction?.id || data.transaction) !== payment.provider_id)) fail(409, 'Provider refund does not match this payment.');
  return tx(ctx, async session => {
    const current = await one(ctx.db, 'refunds', { id: r.id }, session);
    const payment = await one(ctx.db, 'payments', { id: r.payment_id }, session);
    if (current.status === 'processed') return current;
    if (data.status === 'processed') {
      const lines = [credit('provider_cash', r.amount_pesewas)];
      if (r.kind === 'order_charges') lines.push(debit('delivery_payable', r.delivery_pesewas), debit('tax_payable', r.tax_pesewas));
      else if (!r.order_item_id) lines.push(debit('refund_payable', r.amount_pesewas));
      else {
        const e = await one(ctx.db, 'vendor_earnings', { order_item_id: r.order_item_id }, session);
        if (e.status === 'reserved') fail(409, 'Refund conflicts with a payout reservation.');
        lines.push(debit(e.status === 'paid' ? account('vendor_debt', e.vendor_id) : account(e.status === 'eligible' ? 'vendor_available' : 'vendor_pending', e.vendor_id), r.vendor_pesewas));
        lines.push(debit(e.recognized_at ? 'commission_revenue' : 'deferred_commission', r.commission_pesewas));
        await save(ctx.db, 'vendor_earnings', e.id, { remaining_pesewas: e.remaining_pesewas - r.vendor_pesewas, refunded_pesewas: e.refunded_pesewas + r.amount_pesewas, refunded_commission_pesewas: e.refunded_commission_pesewas + r.commission_pesewas }, session);
        if (e.status === 'paid') await notice(ctx.db, session, e.vendor_id, 'Post-payout refund debt', 'A completed refund created a separately recorded vendor debt. No negative wallet cash or automatic COD offset was created.');
        await ctx.db.collection('disputes').updateMany({ order_item_id: e.order_item_id, decision: 'buyer_refund_required', status: 'open' }, { $set: { status: 'resolved', refund_id: r.id, resolved_at: timestamp() } }, { session });
      }
      await ledger(ctx.db, session, 'refund-settle:' + r.id, postings(lines), { refund_id: r.id, payment_id: payment.id });
      const refunded = (payment.refunded_pesewas || 0) + r.amount_pesewas;
      const status = refunded === payment.amount_pesewas ? 'refunded' : 'partially_refunded';
      await save(ctx.db, 'payments', payment.id, { refunded_pesewas: refunded, status, ...(r.kind === 'order_charges' ? { delivery_refunded_pesewas: (payment.delivery_refunded_pesewas || 0) + r.delivery_pesewas, tax_refunded_pesewas: (payment.tax_refunded_pesewas || 0) + r.tax_pesewas } : {}) }, session);
      await save(ctx.db, 'orders', payment.order_id, { payment_status: status }, session);
      await save(ctx.db, 'refunds', r.id, { status: 'processed', processed_at: timestamp() }, session);
      await matched(ctx, 'refund', r.id, session);
      await notice(ctx.db, session, payment.buyer_id, 'Refund completed', 'The provider confirmed your refund.', '/account/orders?order=' + payment.order_id);
    } else {
      await save(ctx.db, 'refunds', r.id, { status: data.status === 'failed' ? 'failed' : 'processing' }, session);
      if (data.status === 'failed') await matched(ctx, 'refund', r.id, session);
    }
    await financeAudit(ctx.db, session, null, 'Provider refund status verified', { refund_id: r.id, provider_status: data.status });
    return one(ctx.db, 'refunds', { id: r.id }, session);
  });
}

export async function acceptEvent(ctx, event) {
  if (!event || typeof event.event !== 'string' || !event.data || typeof event.data !== 'object') fail(400, 'Invalid provider event.');
  const d = event.data, eventKey = digest([event.event, d.id || '', d.reference || d.transaction?.reference || '', d.status || ''].join(':'));
  return tx(ctx, async session => {
    const existing = await one(ctx.db, 'webhook_events', { provider: 'paystack', event_key: eventKey }, session); if (existing) return existing.id;
    const record = { id: id(), provider: 'paystack', event_key: eventKey, event: event.event, reference: d.reference || d.transaction?.reference || '', provider_id: String(d.id || ''), transaction_id: String(d.transaction?.id || d.transaction || ''), status: 'pending', created_at: timestamp() };
    await ctx.db.collection('webhook_events').insertOne(record, { session });
    await queue(ctx.db, session, 'event:' + record.id, 'event', record.id);
    return record.id;
  });
}
async function processEvent(ctx, eventId) {
  const e = await one(ctx.db, 'webhook_events', { id: eventId }); if (!e || e.status === 'processed') return;
  if (e.event === 'charge.success') {
    const p = await one(ctx.db, 'payments', { reference: e.reference, provider: 'paystack' });
    if (p) await verifyPayment(ctx, p.id); else await discrepancy(ctx, 'unmatched_payment', e.id, 'Signed event references a payment outside this order system.');
  } else if (e.event.startsWith('transfer.')) {
    const p = await one(ctx.db, 'payouts', { transfer_reference: e.reference });
    if (p) await settleTransfer(ctx, p.id); else await discrepancy(ctx, 'unmatched_transfer', e.id, 'Signed event references an unknown transfer.');
  } else if (e.event.startsWith('refund.')) {
    let r = await one(ctx.db, 'refunds', { provider_id: e.provider_id });
    if (!r) {
      // Unknown IDs must be matched by an administrator; never infer ownership from amount alone.
      await discrepancy(ctx, 'unmatched_refund', e.id, 'Match this provider refund ID to a queued refund before posting.');
    } else await settleRefund(ctx, r.id);
  } else if (e.event.startsWith('charge.dispute.')) {
    const p = await one(ctx.db, 'payments', { provider_id: e.transaction_id });
    if (p) await tx(ctx, async session => {
      for (const line of await rows(ctx.db, 'order_items', { order_id: p.order_id }, session)) {
        const key = 'provider:' + e.provider_id + ':' + line.id;
        const existing = await one(ctx.db, 'disputes', { id: key }, session);
        if (existing?.status === 'resolved') continue;
        await ctx.db.collection('disputes').updateOne({ id: key }, { $set: { status: 'open', provider_dispute: true, provider_dispute_id: e.provider_id, provider_event: e.event }, $setOnInsert: { order_item_id: line.id, order_id: p.order_id, vendor_id: line.vendor_id, buyer_id: p.buyer_id, created_at: timestamp() } }, { session, upsert: true });
      }
    });
    await discrepancy(ctx, 'chargeback', e.provider_id, 'Provider dispute requires documented administrator reconciliation. Earnings remain held.');
  }
  await save(ctx.db, 'webhook_events', e.id, { status: 'processed', processed_at: timestamp() });
}

export async function resolveProviderDispute(ctx, disputeId, input) {
  admin(ctx.user); await reauthenticate(ctx.user, input.password);
  const dispute = await one(ctx.db, 'disputes', { id: disputeId, provider_dispute: true });
  if (!dispute?.provider_dispute_id) fail(404, 'Provider dispute not found.');
  const data = await ctx.provider.verifyDispute(dispute.provider_dispute_id);
  const payment = await one(ctx.db, 'payments', { order_id: dispute.order_id });
  if (String(data.id) !== dispute.provider_dispute_id || data.domain !== mode(ctx) || data.transaction?.reference !== payment?.reference || data.transaction?.currency !== 'GHS' || data.status !== 'resolved') fail(409, 'The provider has not confirmed a resolved dispute for this payment.');
  const amount = money(data.refund_amount || 0, 'provider chargeback amount');
  if (!['merchant-accepted', 'declined'].includes(data.resolution) || (data.resolution === 'declined' && amount)) fail(409, 'Ambiguous provider dispute resolution requires support review.');
  return tx(ctx, async session => {
    const current = await one(ctx.db, 'disputes', { id: disputeId }, session);
    if (current.status === 'resolved') return current;
    const p = await one(ctx.db, 'payments', { id: payment.id }, session);
    const key = 'chargeback:' + dispute.provider_dispute_id;
    if (amount && !await one(ctx.db, 'ledger_entries', { key }, session)) {
      const earnings = await rows(ctx.db, 'vendor_earnings', { payment_id: p.id }, session);
      if (earnings.some(e => e.status === 'reserved')) fail(409, 'Reconcile or cancel reserved payouts before allocating the confirmed chargeback.');
      if (await one(ctx.db, 'refunds', { payment_id: p.id, status: { $in: ['queued', 'submitted', 'pending', 'processing', 'reconciliation_required'] } }, session)) fail(409, 'Resolve pending refunds before allocating a chargeback.');
      const grossRemaining = earnings.reduce((sum, e) => sum + e.gross_pesewas - e.refunded_pesewas, 0);
      if (amount > grossRemaining || amount + (p.refunded_pesewas || 0) > p.amount_pesewas) fail(409, 'Chargeback exceeds unrefunded merchandise; review delivery/tax or prior refund allocations with provider support.');
      const lines = [credit('provider_cash', amount)]; let allocated = 0, cumulative = 0;
      for (const e of earnings.sort((a, b) => a.id.localeCompare(b.id))) {
        const remaining = e.gross_pesewas - e.refunded_pesewas;
        cumulative += remaining;
        const share = Number(BigInt(amount) * BigInt(cumulative) / BigInt(grossRemaining)) - allocated;
        allocated += share; if (!share) continue;
        const fee = share === remaining ? e.commission_pesewas - e.refunded_commission_pesewas : Number(BigInt(share) * BigInt(e.commission_pesewas) / BigInt(e.gross_pesewas));
        const liability = e.status === 'paid' ? 'vendor_debt' : e.status === 'eligible' ? 'vendor_available' : 'vendor_pending';
        lines.push(debit(account(liability, e.vendor_id), share - fee), debit(e.recognized_at ? 'commission_revenue' : 'deferred_commission', fee));
        await save(ctx.db, 'vendor_earnings', e.id, { remaining_pesewas: e.remaining_pesewas - share + fee, refunded_pesewas: e.refunded_pesewas + share, refunded_commission_pesewas: e.refunded_commission_pesewas + fee }, session);
        await notice(ctx.db, session, e.vendor_id, 'Provider dispute resolved', 'A provider-confirmed chargeback was allocated to this order. Already paid amounts are recorded as separate refund debt.');
      }
      await ledger(ctx.db, session, key, postings(lines), { payment_id: p.id, provider_dispute_id: dispute.provider_dispute_id, verified_by: ctx.user.id });
      const refunded = (p.refunded_pesewas || 0) + amount, status = refunded === p.amount_pesewas ? 'refunded' : 'partially_refunded';
      await save(ctx.db, 'payments', p.id, { refunded_pesewas: refunded, status }, session);
      await save(ctx.db, 'orders', p.order_id, { payment_status: status }, session);
    }
    await ctx.db.collection('disputes').updateMany({ provider_dispute_id: dispute.provider_dispute_id }, { $set: { status: 'resolved', resolution: data.resolution, resolved_at: timestamp(), resolved_by: ctx.user.id } }, { session });
    await matched(ctx, 'chargeback', dispute.provider_dispute_id, session);
    await financeAudit(ctx.db, session, ctx.user, 'Provider dispute resolution verified and allocated', { provider_dispute_id: dispute.provider_dispute_id, amount_pesewas: amount, resolution: data.resolution });
    return true;
  });
}

export async function recordProviderMovement(ctx, input) {
  admin(ctx.user); await reauthenticate(ctx.user, input.password); paymentGate(ctx.config);
  const entryId = text(input.provider_ledger_id, 'provider balance ledger ID', 1, 80), reason = text(input.reason, 'reconciliation evidence', 10, 2000);
  if (!['funding', 'settlement'].includes(input.kind)) fail(400, 'Choose funding or settlement.');
  let found;
  for (let page = 1; page <= 10; page++) {
    const data = await ctx.provider.balanceLedger(page);
    if (!Array.isArray(data)) fail(502, 'Invalid provider balance ledger response.');
    found = data.find(e => String(e.id) === entryId); if (found || data.length < 100) break;
  }
  if (!found || found.currency !== 'GHS' || found.domain !== mode(ctx) || !Number.isSafeInteger(found.difference) || !found.difference || (ctx.config.paystackIntegrationId && String(found.integration) !== String(ctx.config.paystackIntegrationId))) fail(409, 'Provider ledger movement could not be verified.');
  // Transaction, transfer and refund events have their own settlement logic; never double-book them here.
  if (['transaction', 'transfer', 'refund', 'dispute'].includes(String(found.model_responsible).toLowerCase())) fail(409, 'Use the original payment, transfer, refund or dispute reconciliation action.');
  const positive = found.difference > 0, amount = money(Math.abs(found.difference));
  if ((input.kind === 'funding') !== positive) fail(409, 'The verified movement direction does not match this action.');
  if (input.kind === 'settlement' && String(found.model_responsible).toLowerCase() !== 'settlement') fail(409, 'Only a verified settlement can be mapped to bank receipts.');
  return tx(ctx, async session => {
    if (await one(ctx.db, 'ledger_entries', { key: 'provider-movement:' + entryId }, session)) return true;
    const lines = positive ? [debit('provider_cash', amount), credit('platform_funding', amount)] : [debit('external_bank_receipts', amount), credit('provider_cash', amount)];
    await ledger(ctx.db, session, 'provider-movement:' + entryId, lines, { provider_ledger_id: entryId, provider_model: found.model_responsible, provider_model_id: String(found.model_row), reason });
    if (!positive) await ctx.db.collection('provider_reconciliations').updateOne({ id: 'settlement:' + found.model_row }, { $set: { kind: 'settlement', status: 'matched', provider_ledger_id: entryId, created_at: timestamp() } }, { session, upsert: true });
    await financeAudit(ctx.db, session, ctx.user, 'Verified provider balance movement mapped', { provider_ledger_id: entryId, kind: input.kind, amount_pesewas: amount, reason });
    return true;
  });
}

export async function queueReconciliation(ctx) {
  return tx(ctx, async session => {
    const key = 'manual-reconcile:' + id();
    await queue(ctx.db, session, key, 'reconcile', key);
    await financeAudit(ctx.db, session, ctx.user, 'Provider reconciliation queued', { job_id: key });
    return { job_id: key, status: 'pending' };
  });
}
export async function retryFinanceJob(ctx, jobId, input) {
  admin(ctx.user); await reauthenticate(ctx.user, input.password);
  return tx(ctx, async session => {
    const job = await one(ctx.db, 'finance_jobs', { id: jobId }, session);
    if (!job || !['review_required', 'pending'].includes(job.status)) fail(409, 'Only pending or review-required jobs can be retried.');
    await save(ctx.db, 'finance_jobs', job.id, { status: 'pending', attempts: 0, lease_until: '' }, session);
    await financeAudit(ctx.db, session, ctx.user, 'Finance job queued for safe verification retry', { job_id: job.id });
    return true;
  });
}
export async function reconcile(ctx, now = new Date()) {
  providerCredentials(ctx.config);
  const issues = [], since = new Date(now.getTime() - 7 * 86400000).toISOString();
  const payments = (await rows(ctx.db, 'payments', { provider: 'paystack' })).filter(p => p.created_at >= since || !['refunded', 'successful', 'failed'].includes(p.status));
  if (payments.length > 200) issues.push({ kind: 'internal_pagination_limit', id: 'payments' });
  for (const p of payments.slice(0, 200)) {
    try { await verifyPayment(ctx, p.id); } catch { issues.push({ kind: 'payment', id: p.id }); }
  }
  const payouts = await rows(ctx.db, 'payouts', { status: { $in: ['submitted', 'processing', 'reconciliation_required', 'successful'] } });
  if (payouts.length > 200) issues.push({ kind: 'internal_pagination_limit', id: 'payouts' });
  for (const p of payouts.slice(0, 200)) {
    try { await settleTransfer(ctx, p.id); } catch { issues.push({ kind: 'transfer', id: p.id }); }
  }
  const refunds = await rows(ctx.db, 'refunds', { status: { $in: ['pending', 'processing', 'reconciliation_required'] } });
  if (refunds.length > 100) issues.push({ kind: 'internal_pagination_limit', id: 'refunds' });
  for (const r of refunds.slice(0, 100)) {
    try { if (r.provider_id) await settleRefund(ctx, r.id); else issues.push({ kind: 'refund_unknown', id: r.id }); } catch { issues.push({ kind: 'refund', id: r.id }); }
  }
  // Reconcile provider-only activity as well as internal references. Bounded pagination is explicit.
  for (const [kind, getter] of [['payment', 'transactions'], ['transfer', 'transfers'], ['settlement', 'settlements']]) {
    for (let page = 1; page <= 10; page++) {
      const data = await ctx.provider[getter](since, page);
      if (!Array.isArray(data)) fail(502, 'Invalid provider reconciliation response.');
      for (const entry of data) {
        const found = kind === 'payment' ? await one(ctx.db, 'payments', { reference: entry.reference }) : kind === 'transfer' ? await one(ctx.db, 'payouts', { transfer_reference: entry.reference }) : null;
        const accounted = kind === 'settlement' && await one(ctx.db, 'provider_reconciliations', { id: 'settlement:' + entry.id, status: 'matched' });
        if (!found && !accounted && (kind === 'settlement' || ['success', 'pending', 'processing'].includes(entry.status))) issues.push({ kind: 'provider_only_' + kind, id: String(entry.id), reference: entry.reference || '' });
      }
      if (data.length < 100) break;
      if (page === 10) issues.push({ kind: 'pagination_limit', id: kind });
    }
  }
  const balances = await ctx.provider.balances(), actual = Array.isArray(balances) ? balances.find(b => b.currency === 'GHS')?.balance : undefined;
  const expected = await balance(ctx.db, 'provider_cash', undefined, true);
  if (!Number.isSafeInteger(actual) || actual !== expected) issues.push({ kind: 'provider_balance', expected_pesewas: expected, actual_pesewas: Number.isSafeInteger(actual) ? actual : null });
  const entries = await rows(ctx.db, 'ledger_entries');
  const projections = new Map();
  for (const entry of entries) for (const line of entry.lines) {
    const value = projections.get(line.account) || { debit: 0, credit: 0 };
    value.debit += line.debit || 0; value.credit += line.credit || 0; projections.set(line.account, value);
  }
  for (const e of entries) if (e.lines.reduce((n, l) => n + (l.debit || 0) - (l.credit || 0), 0) !== 0) issues.push({ kind: 'unbalanced_ledger', id: e.id });
  for (const a of await rows(ctx.db, 'ledger_accounts')) {
    const expected = projections.get(a.id) || { debit: 0, credit: 0 };
    if (a.debit !== expected.debit || a.credit !== expected.credit) issues.push({ kind: 'account_projection', id: a.id });
    projections.delete(a.id);
  }
  for (const key of projections.keys()) issues.push({ kind: 'missing_account_projection', id: key });
  const report = { id: id(), kind: 'daily', status: issues.length ? 'open' : 'matched', issues, currency: 'GHS', expected_pesewas: expected, actual_pesewas: actual ?? null, created_at: timestamp() };
  await ctx.db.collection('provider_reconciliations').insertOne(report);
  if (!issues.length) await ctx.db.collection('provider_reconciliations').updateMany({ kind: 'daily', status: 'open', id: { $ne: report.id } }, { $set: { status: 'superseded', resolved_by_report: report.id, resolved_at: timestamp() } });
  return report;
}

export async function runFinance(ctx, now = new Date()) {
  const token = id(), stamp = now.toISOString();
  await ctx.db.collection('finance_jobs').updateOne({ id: 'worker-lock' }, { $setOnInsert: { lease_until: '', status: 'lock' } }, { upsert: true });
  const lock = await ctx.db.collection('finance_jobs').findOneAndUpdate({ id: 'worker-lock', lease_until: { $lte: stamp } }, { $set: { lease_until: new Date(now.getTime() + 600000).toISOString(), owner: token } }, { returnDocument: 'after' });
  if (!lock) return { busy: true };
  try {
    for (const p of (await rows(ctx.db, 'payments', { provider: 'paystack', expires_at: { $lte: stamp }, credited_at: { $exists: false } })).slice(0, 100)) await expirePayment(ctx, p.id);
    await releaseEligible(ctx, now);
    await createBatch(ctx, now);
    if (ctx.config.paystackSecretKey) {
      const daily = 'reconcile:' + stamp.slice(0, 10);
      await queue(ctx.db, undefined, daily, 'reconcile', daily);
    }
    const candidates = await ctx.db.collection('finance_jobs').find({ $or: [{ status: 'pending' }, { status: 'processing', lease_until: { $lte: stamp } }] }).limit(10).toArray();
    for (const candidate of candidates) {
      const job = await ctx.db.collection('finance_jobs').findOneAndUpdate({ id: candidate.id, status: candidate.status, lease_until: candidate.lease_until }, { $set: { status: 'processing', lease_until: new Date(Date.now() + 180000).toISOString() }, $inc: { attempts: 1 } }, { returnDocument: 'after' });
      if (!job) continue;
      try {
        if (job.type === 'event') await processEvent(ctx, job.entity_id);
        else if (job.type === 'transfer') await submitTransfer(ctx, job.entity_id);
        else if (job.type === 'refund') await submitRefund(ctx, job.entity_id);
        else if (job.type === 'reconcile') await reconcile(ctx, now);
        await save(ctx.db, 'finance_jobs', job.id, { status: 'completed', completed_at: timestamp() });
        await matched(ctx, 'job', job.id);
      } catch {
        await save(ctx.db, 'finance_jobs', job.id, { status: job.attempts >= 10 ? 'review_required' : 'pending', last_error: 'Processing did not complete; see reconciliation and provider dashboard.' });
        if (job.attempts >= 10) await discrepancy(ctx, 'job', job.id, 'Repeated processing failure requires review. Money reservations have not been released.');
      }
    }
    return { processed: candidates.length };
  } finally { await ctx.db.collection('finance_jobs').updateOne({ id: 'worker-lock', owner: token }, { $set: { lease_until: '' } }); }
}

export async function vendorSummary(ctx) {
  seller(ctx.user); const v = ctx.user.id;
  const earnings = await rows(ctx.db, 'vendor_earnings', { vendor_id: v });
  const recipient = await one(ctx.db, 'payout_accounts', { vendor_id: v });
  return { currency: 'GHS', gross_sales_pesewas: earnings.reduce((sum, e) => sum + e.gross_pesewas, 0),
    pending_pesewas: await balance(ctx.db, account('vendor_pending', v)), eligible_pesewas: await balance(ctx.db, account('vendor_available', v)),
    reserved_pesewas: await balance(ctx.db, account('vendor_reserved', v)), paid_pesewas: (await rows(ctx.db, 'payouts', { vendor_id: v, status: 'successful' })).reduce((n, p) => n + p.amount_pesewas, 0),
    cod_commission_owed_pesewas: await balance(ctx.db, account('cod_receivable', v), undefined, true), refund_debt_pesewas: await balance(ctx.db, account('vendor_debt', v), undefined, true),
    payout_account: recipient ? { masked_account: recipient.masked_account, account_name: recipient.account_name, type: recipient.type, verified_at: recipient.verified_at, mode: recipient.mode } : null,
    schedule: 'Friday 10:00 Africa/Accra', settings: await financeSettings(ctx.db, ctx.config) };
}

export async function financeOverview(ctx) {
  admin(ctx.user);
  const gross = await balance(ctx.db, 'commission_revenue'), processing = await balance(ctx.db, 'processing_expense', undefined, true), transfer = await balance(ctx.db, 'transfer_expense', undefined, true);
  return { currency: 'GHS', commission_pesewas: gross, processing_fees_pesewas: processing, transfer_fees_pesewas: transfer, net_contribution_pesewas: gross - processing - transfer,
    provider_cash_pesewas: await balance(ctx.db, 'provider_cash', undefined, true), pending_commission_pesewas: await balance(ctx.db, 'deferred_commission'),
    settings: await financeSettings(ctx.db, ctx.config), flags: { payments_enabled: !!ctx.config.paymentsEnabled, payouts_enabled: !!ctx.config.payoutsEnabled, test_mode: !!ctx.config.paystackTestMode, delayed_settlement_approved: !!ctx.config.delayedSettlementApproved, approval_required: true },
    cod_receivables: (await rows(ctx.db, 'ledger_accounts')).filter(a => a.id.startsWith('cod_receivable:')).map(a => ({ vendor_id: a.id.split(':')[1], owed_pesewas: a.debit - a.credit })),
    blocked: await ctx.db.collection('provider_reconciliations').countDocuments({ status: 'open' }) };
}
export async function updateSettings(ctx, input) {
  admin(ctx.user); await reauthenticate(ctx.user, input.password);
  const changes = {};
  for (const [key, max] of Object.entries({ commission_bps: 10000, minimum_payout_pesewas: 100000000, waiting_hours: 8760, delivery_fee_pesewas: 1000000, tax_bps: 10000, max_cod_receivable_pesewas: 100000000, estimated_processing_fee_bps: 10000, estimated_transfer_fee_pesewas: 1000000 })) {
    if (input[key] !== undefined) { if (!Number.isSafeInteger(input[key]) || input[key] < 0 || input[key] > max) fail(400, 'Invalid finance setting: ' + key); changes[key] = input[key]; }
  }
  if (typeof input.cod_enabled === 'boolean') changes.cod_enabled = input.cod_enabled;
  for (const key of ['cod_vendor_ids', 'cod_categories']) if (input[key] !== undefined) { if (!Array.isArray(input[key]) || input[key].length > 500 || input[key].some(v => typeof v !== 'string' || v.length > 120)) fail(400, 'Invalid COD eligibility list.'); changes[key] = input[key]; }
  return tx(ctx, async session => {
    const before = await financeSettings(ctx.db, ctx.config, session);
    await ctx.db.collection('finance_settings').updateOne({ id: 'platform' }, { $set: { ...changes, updated_at: timestamp(), updated_by: ctx.user.id }, $inc: { version: 1 } }, { session, upsert: true });
    await financeAudit(ctx.db, session, ctx.user, 'Finance settings updated for future orders', { before, changes });
    return financeSettings(ctx.db, ctx.config, session);
  });
}
export async function recordReceivableCollection(ctx, input) {
  admin(ctx.user); await reauthenticate(ctx.user, input.password);
  const amount = money(input.amount_pesewas), kind = input.kind === 'refund_debt' ? 'vendor_debt' : input.kind === 'cod' ? 'cod_receivable' : null;
  if (!kind || !amount) fail(400, 'Choose COD or refund debt and a positive amount.');
  const vendorId = text(input.vendor_id, 'vendor ID', 1, 128), reference = text(input.reference, 'external receipt reference', 5, 128);
  return tx(ctx, async session => {
    const previous = await one(ctx.db, 'ledger_entries', { key: 'receivable-receipt:' + reference }, session);
    if (previous) {
      if (previous.metadata.vendor_id !== vendorId || previous.lines[0].debit !== amount || previous.lines[1].account !== account(kind, vendorId)) fail(409, 'This bank receipt reference was already allocated to another amount or receivable.');
      return true;
    }
    if (amount > await balance(ctx.db, account(kind, vendorId), session, true)) fail(400, 'Receipt exceeds the outstanding receivable.');
    const allocations = []; let remaining = amount;
    if (kind === 'cod_receivable') {
      const items = await ctx.db.collection('order_items').find({ vendor_id: vendorId, cod_commission_status: 'owed' }, { session }).sort({ created_at: 1, id: 1 }).toArray();
      for (const item of items) {
        if (!remaining) break;
        const paid = item.cod_commission_collected_pesewas || 0, share = Math.min(remaining, item.commission_pesewas - paid);
        if (share <= 0) continue;
        allocations.push({ order_item_id: item.id, amount_pesewas: share }); remaining -= share;
        await save(ctx.db, 'order_items', item.id, { cod_commission_collected_pesewas: paid + share, cod_commission_status: paid + share === item.commission_pesewas ? 'collected' : 'owed' }, session);
      }
      if (remaining) fail(409, 'COD receivable projections do not match the original item allocations. Reconcile before collecting.');
    }
    await ledger(ctx.db, session, 'receivable-receipt:' + reference, [debit('external_bank_receipts', amount), credit(account(kind, vendorId), amount)], { vendor_id: vendorId, external_receipt: reference, recorded_by: ctx.user.id, allocations });
    await financeAudit(ctx.db, session, ctx.user, 'External receivable collection recorded', { vendor_id: vendorId, amount_pesewas: amount, kind, reference });
    await notice(ctx.db, session, vendorId, 'Commission/debt receipt recorded', 'An administrator recorded an itemized external receipt against your receivable.');
    return true;
  });
}

export async function listFinance(ctx, collection, query = {}, vendorOnly = false) {
  if (vendorOnly) seller(ctx.user); else admin(ctx.user);
  const page = Math.max(1, Math.min(100000, Number(query.page) || 1)), limit = Math.max(1, Math.min(100, Number(query.limit) || 25));
  if (!Number.isInteger(page) || !Number.isInteger(limit)) fail(400, 'Invalid pagination.');
  const filter = vendorOnly ? { vendor_id: ctx.user.id } : {};
  if (collection === 'system_logs') filter.source = 'finance';
  if (query.status) filter.status = text(query.status, 'status', 1, 40);
  if (!vendorOnly && query.vendor_id) filter.vendor_id = text(query.vendor_id, 'vendor ID', 1, 128);
  const data = await ctx.db.collection(collection).find(filter).sort({ created_at: -1, id: 1 }).skip((page - 1) * limit).limit(limit).toArray();
  return { rows: data.map(({ _id, encrypted_details: _encrypted, recipient_code: _recipient, identity_hash: _hash, ...row }) => row), total: await ctx.db.collection(collection).countDocuments(filter), page, limit };
}
