import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError, fail } from './security.mjs';

export function paymentGate(config, payouts = false) {
  if (!config.paymentsEnabled) fail(503, 'Online payments are not enabled.');
  providerCredentials(config);
  if (!config.paystackTestMode && (!config.delayedSettlementApproved || !config.paystackBusinessVerified || !config.paymentChannelsVerified)) fail(503, 'Live payments require verified merchant, channel and delayed settlement approval.');
  if (payouts && (!config.payoutsEnabled || (!config.paystackTestMode && !config.paystackTransfersVerified))) fail(503, 'Vendor transfers are not activated for this merchant.');
}
export function providerCredentials(config) {
  if (!config.paystackSecretKey?.startsWith(config.paystackTestMode ? 'sk_test_' : 'sk_live_')) fail(503, 'Payment credentials do not match the configured mode.');
}
export function verifySignature(raw, signature, secret) {
  if (!secret || !Buffer.isBuffer(raw) || !/^[a-f0-9]{128}$/i.test(signature || '')) return false;
  const expected = createHmac('sha512', secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
export class Paystack {
  constructor(config, fetcher = fetch) { this.config = config; this.fetcher = fetcher; }
  async call(method, path, body) {
    // Verification and refunds remain possible when new checkouts or payouts are disabled.
    providerCredentials(this.config);
    let response;
    try { response = await this.fetcher('https://api.paystack.co' + path, { method, headers: { Authorization: `Bearer ${this.config.paystackSecretKey}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000) }); }
    catch { throw new ApiError(503, 'Provider response is unknown. Reconciliation is required; do not retry the transfer.', 'PROVIDER_UNKNOWN'); }
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.status !== true) throw new ApiError(503, 'The payment provider could not complete the request. Check the provider dashboard.', response.status >= 500 ? 'PROVIDER_UNKNOWN' : 'PROVIDER_REJECTED');
    return result.data;
  }
  initialize(payment, email) { paymentGate(this.config); return this.call('POST', '/transaction/initialize', { reference: payment.reference, amount: payment.amount_pesewas, currency: 'GHS', email, channels: this.config.paystackChannels, callback_url: `${this.config.origin}/payment-return?payment=${payment.id}`, metadata: { order_id: payment.order_id, payment_id: payment.id } }); }
  verifyPayment(reference) { return this.call('GET', '/transaction/verify/' + encodeURIComponent(reference)); }
  createRecipient(data) { return this.call('POST', '/transferrecipient', { ...data, currency: 'GHS' }); }
  banks(type) { return this.call('GET', '/bank?country=ghana&currency=GHS&perPage=100&type=' + encodeURIComponent(type)); }
  verifyDispute(id) { return this.call('GET', '/dispute/' + encodeURIComponent(id)); }
  balanceLedger(page = 1) { return this.call('GET', `/balance/ledger?perPage=100&page=${page}`); }
  transfer(payout) { paymentGate(this.config, true); return this.call('POST', '/transfer', { source: 'balance', reference: payout.transfer_reference, amount: payout.amount_pesewas, recipient: payout.recipient_code, currency: 'GHS', reason: 'Unimall weekly vendor payout' }); }
  verifyTransfer(reference) { return this.call('GET', '/transfer/verify/' + encodeURIComponent(reference)); }
  refund(refund, payment) { return this.call('POST', '/refund', { transaction: payment.reference, amount: refund.amount_pesewas, currency: 'GHS', merchant_note: refund.id }); }
  verifyRefund(providerId) { return this.call('GET', '/refund/' + encodeURIComponent(providerId)); }
  balances() { return this.call('GET', '/balance'); }
  transactions(from, page = 1) { return this.call('GET', `/transaction?from=${encodeURIComponent(from)}&perPage=100&page=${page}`); }
  transfers(from, page = 1) { return this.call('GET', `/transfer?from=${encodeURIComponent(from)}&perPage=100&page=${page}`); }
  settlements(from, page = 1) { return this.call('GET', `/settlement?from=${encodeURIComponent(from)}&perPage=100&page=${page}`); }
}
