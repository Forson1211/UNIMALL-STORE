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
  return {
    production, origin, database, uri: env.MONGODB_URI || '', port, dnsServers,
    cookieName: production ? '__Host-unimall_session' : 'unimall_session',
    sessionDays: 7, smtpUrl: env.SMTP_URL || '', mailFrom: env.MAIL_FROM || '',
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION === 'true',
    trustProxy: env.TRUST_PROXY === 'true' || Boolean(env.VERCEL),
  };
}
