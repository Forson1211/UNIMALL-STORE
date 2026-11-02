import { Router, raw } from 'express';
import { rateLimit } from 'express-rate-limit';
import { timingSafeEqual } from 'node:crypto';
import { Paystack, paymentGate, verifySignature } from './paystack.mjs';
import { admin, financeAudit, financeSettings, reauthenticate, seller } from './finance-model.mjs';
import { fail, identity } from './security.mjs';
import * as finance from './finance.mjs';

export function webhookHandler(dependencies) {
  return [raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
    if (!verifySignature(req.body, req.get('x-paystack-signature'), dependencies.config.paystackSecretKey)) fail(401, 'Invalid webhook signature.');
    let event; try { event = JSON.parse(req.body.toString('utf8')); } catch { fail(400, 'Invalid webhook JSON.'); }
    await finance.acceptEvent(dependencies, event);
    res.status(200).json({ received: true });
  }];
}
async function privatePayment(ctx, id) {
  identity(ctx.user);
  const payment = await ctx.db.collection('payments').findOne({ id });
  if (!payment || (payment.buyer_id !== ctx.user.id && !['admin', 'super_admin'].includes(ctx.user.role))) fail(404, 'Payment not found in your account.');
  return payment;
}
export function financeRouter(dependencies) {
  const router = Router(), moneyLimit = rateLimit({ windowMs: 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
  const context = req => ({ ...dependencies, user: req.user });
  const get = (path, work) => router.get(path, async (req, res) => res.json({ data: await work(context(req), req), error: null }));
  const post = (path, work, method = 'post') => router[method](path, moneyLimit, async (req, res) => res.json({ data: await work(context(req), req), error: null }));
  get('/payments/config', async ctx => {
    let enabled = false; try { paymentGate(ctx.config); enabled = true; } catch { /* Disabled channels remain unavailable. */ }
    const settings = await financeSettings(ctx.db, ctx.config);
    return { online_enabled: enabled, cod_enabled: settings.cod_enabled, test_mode: ctx.config.paystackTestMode, currency: 'GHS', channels: enabled ? ctx.config.paystackChannels : [] };
  });
  post('/checkout', (ctx, req) => finance.createCheckout(ctx, req.body));
  get('/payments/:id', async (ctx, req) => finance.safePayment(await privatePayment(ctx, req.params.id)));
  get('/orders/:id/payment', async (ctx, req) => {
    identity(ctx.user);
    const p = await ctx.db.collection('payments').findOne({ order_id: req.params.id, buyer_id: ctx.user.id });
    if (!p) fail(404, 'Payment not found in your account.');
    return finance.safePayment(p);
  });
  post('/payments/:id/verify', async (ctx, req) => { await privatePayment(ctx, req.params.id); return finance.verifyPayment(ctx, req.params.id); });
  post('/orders/items/:id/confirm-delivery', (ctx, req) => finance.confirmDelivery(ctx, req.params.id, req.body));
  post('/disputes', (ctx, req) => finance.openDispute(ctx, req.body));
  post('/vendor/cod/:id/confirm', (ctx, req) => finance.confirmCodVendor(ctx, req.params.id));
  get('/vendor/finance/summary', ctx => finance.vendorSummary(ctx));
  get('/vendor/payout-banks', async (ctx, req) => {
    seller(ctx.user);
    if (!['ghipss', 'mobile_money'].includes(req.query.type)) fail(400, 'Choose a Ghana bank or mobile money recipient.');
    const banks = await ctx.provider.banks(req.query.type);
    return banks.filter(b => b.active && b.currency === 'GHS').map(b => ({ name: b.name, code: b.code }));
  });
  get('/vendor/earnings', (ctx, req) => finance.listFinance(ctx, 'vendor_earnings', req.query, true));
  get('/vendor/payouts', (ctx, req) => finance.listFinance(ctx, 'payouts', req.query, true));
  post('/vendor/payout-account', (ctx, req) => finance.setPayoutAccount(ctx, req.body));
  get('/admin/finance/overview', ctx => finance.financeOverview(ctx));
  get('/admin/finance/jobs', async (ctx, req) => {
    const result = await finance.listFinance(ctx, 'finance_jobs', req.query);
    return { ...result, rows: result.rows.filter(row => row.id !== 'worker-lock') };
  });
  post('/admin/finance/jobs/:id/retry', (ctx, req) => finance.retryFinanceJob(ctx, req.params.id, req.body));
  for (const [path, collection] of [['payout-batches', 'payout_batches'], ['payouts', 'payouts'], ['refunds', 'refunds'], ['disputes', 'disputes'], ['reconciliation', 'provider_reconciliations'], ['finance/earnings', 'vendor_earnings'], ['finance/ledger', 'ledger_entries'], ['finance/audit', 'system_logs']]) get('/admin/' + path, (ctx, req) => finance.listFinance(ctx, collection, req.query));
  post('/admin/payout-batches/run', async (ctx, req) => { admin(ctx.user); await reauthenticate(ctx.user, req.body.password); return finance.createBatch(ctx); });
  post('/admin/payout-batches/:id/approve', (ctx, req) => finance.approveBatch(ctx, req.params.id, req.body));
  post('/admin/payouts/:id/cancel', (ctx, req) => finance.cancelPayout(ctx, req.params.id, req.body));
  post('/admin/payouts/:id/resolve-reversal', (ctx, req) => finance.resolveReversedTransfer(ctx, req.params.id, req.body));
  post('/admin/payouts/:id/reconcile', async (ctx, req) => { admin(ctx.user); await reauthenticate(ctx.user, req.body.password); return finance.settleTransfer(ctx, req.params.id); });
  post('/admin/refunds', (ctx, req) => finance.requestRefund(ctx, req.body));
  post('/admin/disputes/:id/resolve', (ctx, req) => finance.resolveDispute(ctx, req.params.id, req.body));
  post('/admin/disputes/:id/verify-provider', (ctx, req) => finance.resolveProviderDispute(ctx, req.params.id, req.body));
  post('/admin/reconciliation/provider-movement', (ctx, req) => finance.recordProviderMovement(ctx, req.body));
  post('/admin/finance/settings', (ctx, req) => finance.updateSettings(ctx, req.body), 'patch');
  post('/admin/finance/receivables/collect', (ctx, req) => finance.recordReceivableCollection(ctx, req.body));
  post('/admin/finance/cod/:id/collect', (ctx, req) => finance.collectCod(ctx, req.params.id));
  post('/admin/reconciliation/run', async (ctx, req) => { admin(ctx.user); await reauthenticate(ctx.user, req.body.password); return finance.queueReconciliation(ctx); });
  post('/admin/refunds/:id/reconcile', async (ctx, req) => {
    admin(ctx.user); await reauthenticate(ctx.user, req.body.password);
    if (req.body.provider_id) {
      const r = await ctx.db.collection('refunds').findOne({ id: req.params.id });
      if (!r || r.provider_id || r.status !== 'reconciliation_required') fail(409, 'Only an unresolved refund without a provider ID can be matched.');
      const verified = await ctx.provider.verifyRefund(String(req.body.provider_id));
      if (verified.merchant_note !== r.id) fail(409, 'The provider merchant note must match this exact refund ID.');
      const payment = await ctx.db.collection('payments').findOne({ id: r.payment_id });
      if (verified.amount !== r.amount_pesewas || verified.currency !== 'GHS' || (verified.transaction?.reference !== payment?.reference && String(verified.transaction?.id || verified.transaction) !== payment?.provider_id)) fail(409, 'The provider refund amount, currency and original payment must match.');
      await ctx.db.collection('refunds').updateOne({ id: r.id, provider_id: { $exists: false } }, { $set: { provider_id: String(verified.id) } });
      await financeAudit(ctx.db, undefined, ctx.user, 'Unknown refund matched to provider ID', { refund_id: r.id, provider_id: String(verified.id) });
    }
    return finance.settleRefund(ctx, req.params.id);
  });
  router.get('/admin/payout-batches/:id/report.csv', async (req, res) => {
    admin(req.user);
    const payouts = await dependencies.db.collection('payouts').find({ batch_id: req.params.id }).toArray();
    const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'").replaceAll('"', '""') + '"';
    const columns = ['batch_id', 'id', 'vendor_id', 'currency', 'amount_pesewas', 'fee_pesewas', 'status', 'transfer_reference', 'masked_account'];
    res.type('text/csv').attachment('payout-batch.csv').send([columns.join(','), ...payouts.map(p => columns.map(k => cell(p[k])).join(','))].join('\r\n'));
  });
  post('/internal/finance/run', async (ctx, req) => {
    const expected = ctx.config.financeCronSecret, supplied = (req.get('authorization') || '').replace(/^Bearer /, '');
    if (!expected || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) fail(401, 'Invalid scheduler credential.');
    return finance.runFinance(dependencies);
  });
  return router;
}
export function financeDependencies(dependencies) { return { ...dependencies, provider: dependencies.financeProvider || new Paystack(dependencies.config) }; }
