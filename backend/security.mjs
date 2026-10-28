import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import bcrypt from 'bcryptjs';

const scrypt = promisify(scryptCallback);
export class ApiError extends Error {
  constructor(status, message, code = 'API_ERROR') { super(message); this.status = status; this.code = code; }
}
export const fail = (status, message, code) => { throw new ApiError(status, message, code); };
export const token = () => randomBytes(32).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export const timestamp = () => new Date().toISOString();
export const identity = user => { if (!user) fail(401, 'Sign in to continue.'); return user.id; };
export const hasRole = (user, ...roles) => !!user && !user.disabled && roles.includes(user.role);
export const staff = (user, ...roles) => { identity(user); if (!hasRole(user, 'admin', ...roles)) fail(403, 'Your account cannot perform this action.'); };
export const approved = user => hasRole(user, 'admin') || (hasRole(user, 'vendor') && user.vendor_status === 'approved');
export const publicUser = user => user ? { id: user.id, email: user.email, email_confirmed_at: user.email_verified ? user.created_at : null,
  user_metadata: { full_name: user.full_name || '', store_name: user.store_name || '' }, created_at: user.created_at } : null;
export function text(value, name, min = 1, max = 5000) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(400, `Enter a valid ${name}.`);
  return value.trim();
}
export function emailAddress(value) {
  const email = text(value, 'email address', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a valid email address.');
  return email;
}
export function cents(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) fail(400, 'Use a valid money amount with at most two decimal places.');
  return Math.round(value * 100);
}
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) fail(400, 'Use a password with 8 to 128 characters.');
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`;
}
export async function verifyPassword(password, hash = '') {
  if (typeof password !== 'string' || password.length > 128) return false;
  if (/^\$2[aby]\$/.test(hash)) return bcrypt.compare(password, hash);
  const [scheme, salt, expected] = hash.split(':');
  if (scheme !== 'scrypt' || !salt || !/^[a-f0-9]{128}$/.test(expected || '')) return false;
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export function cleanObject(value) {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(cleanObject);
  if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) fail(400, 'Invalid request value.');
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.') || ['__proto__', 'constructor', 'prototype'].includes(key)) fail(400, 'Invalid request field.');
    result[key] = cleanObject(item);
  }
  return result;
}
