import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';

const envPath = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(envPath)) loadEnvFile(envPath);

export function configuration(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const defaultOrigin = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:8080';
  const origin = new URL(env.APP_ORIGIN || defaultOrigin).origin;
  if (production && !origin.startsWith('https://')) throw new Error('APP_ORIGIN must use HTTPS in production.');
  const database = env.MONGODB_DATABASE || 'unimall';
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(database)) throw new Error('Use a simple MONGODB_DATABASE name.');
  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
  const dnsServers = (env.MONGODB_DNS_SERVERS || '').split(',').map(value => value.trim()).filter(Boolean);
  if (dnsServers.some(value => !isIP(value))) throw new Error('MONGODB_DNS_SERVERS must contain comma-separated DNS server IP addresses.');
  const flag = key => env[key] === 'true';
  const integer = (key, fallback, maximum = 1000000000) => {
    const n = env[key] == null || env[key] === '' ? fallback : Number(env[key]);
    if (!Number.isSafeInteger(n) || n < 0 || n > maximum) throw new Error(`${key} must be a nonnegative integer.`);
    return n;
  };
  const paystackTestMode = env.PAYSTACK_TEST_MODE !== 'false';
  const paystackChannels = (env.PAYSTACK_CHANNELS || 'card').split(',').map(v => v.trim()).filter(Boolean);
  if (paystackChannels.some(c => !['card', 'mobile_money', 'bank', 'bank_transfer', 'ussd', 'qr'].includes(c))) throw new Error('Invalid PAYSTACK_CHANNELS.');
  return {
    production, origin, database, uri: env.MONGODB_URI || '', port, dnsServers,
    cookieName: production ? '__Host-unimall_session' : 'unimall_session',
    sessionDays: 7, smtpUrl: env.SMTP_URL || '', mailFrom: env.MAIL_FROM || '',
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION === 'true',
    trustProxy: env.TRUST_PROXY === 'true' || Boolean(env.VERCEL),
    paymentsEnabled: flag('PAYMENTS_ENABLED'), payoutsEnabled: flag('PAYOUTS_ENABLED'), payoutsRequireApproval: true,
    paystackTestMode, paystackChannels, paystackSecretKey: env.PAYSTACK_SECRET_KEY || '',
    paystackIntegrationId: env.PAYSTACK_INTEGRATION_ID || '', paymentChannelsVerified: flag('PAYMENT_CHANNELS_VERIFIED'),
    delayedSettlementApproved: flag('ESCROW_OR_DELAYED_SETTLEMENT_APPROVED'), paystackBusinessVerified: flag('PAYSTACK_BUSINESS_VERIFIED'),
    paystackTransfersVerified: flag('PAYSTACK_TRANSFERS_VERIFIED'), payoutEncryptionKey: env.PAYOUT_ENCRYPTION_KEY || '',
    financeCronSecret: env.FINANCE_CRON_SECRET || '', checkoutExpiryMinutes: integer('CHECKOUT_EXPIRY_MINUTES', 30, 1440),
    financeDefaults: { commission_bps: integer('PLATFORM_COMMISSION_BPS', 500, 10000), minimum_payout_pesewas: integer('PAYOUT_MINIMUM_PESEWAS', 2000),
      waiting_hours: integer('PAYOUT_WAITING_HOURS', 48, 8760), cod_enabled: env.COD_ENABLED !== 'false' },
  };
}
