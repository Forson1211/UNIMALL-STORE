import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configuration } from '../config.mjs';
import { cents, cleanObject, hashPassword, verifyPassword, publicUser } from '../security.mjs';
import { buildFilter, projectRow, readQuery, mutateQuery } from '../queries.mjs';
import { fixture } from './fixtures.mjs';

test('passwords use salted hashes and reject incorrect or malformed input', async () => {
  const first = await hashPassword('correct-password');
  const second = await hashPassword('correct-password');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('correct-password', first), true);
  assert.equal(await verifyPassword('incorrect-password', first), false);
  assert.equal(await verifyPassword('correct-password', 'bad-hash'), false);
  await assert.rejects(hashPassword('short'), { status: 400 });
});
test('request data rejects Mongo operators and prototype keys recursively', () => {
  for (const data of [{ details: { $gt: '' } }, JSON.parse('{"__proto__":{"admin":true}}'), { 'profile.role': 'admin' }]) assert.throws(() => cleanObject(data), { status: 400 });
  assert.deepEqual(cleanObject({ items: [{ id: 'a', quantity: 2 }] }), { items: [{ id: 'a', quantity: 2 }] });
});
test('query filters reject operator injection and escape search regex syntax', () => {
  assert.throws(() => buildFilter([{ op: 'eq', field: 'id', value: { $ne: null } }]), { status: 400 });
  assert.throws(() => buildFilter([{ op: 'eq', field: 'password_hash', value: 'x' }]), { status: 400 });
  assert.throws(() => buildFilter([null]), { status: 400 });
  assert.deepEqual(buildFilter([{ op: 'ilike', field: 'name', value: '%a.b%' }]), { $and: [{ name: { $regex: '^.*a\\.b.*$', $options: 'i' } }] });
});
test('response projections strip secrets even in nested wildcard results', () => {
  const row = { id: 'public', password_hash: 'secret', _id: 'internal', products: [{ id: 'p', token_hash: 'secret' }] };
  assert.deepEqual(projectRow(row, '*,products(*)'), { id: 'public', products: [{ id: 'p' }] });
  assert.equal(publicUser({ id: 'x', password_hash: 'secret', role: 'admin' }).password_hash, undefined);
});
test('money validation keeps exact cents and rejects negative, fractional and nonfinite input', () => {
  assert.equal(cents(10.01), 1001);
  for (const value of [-1, 1.001, NaN, Infinity, '10']) assert.throws(() => cents(value), { status: 400 });
});
test('configuration validates the production origin, database name and port', () => {
  assert.throws(() => configuration({ NODE_ENV: 'production', APP_ORIGIN: 'http://example.com' }));
  assert.throws(() => configuration({ MONGODB_DATABASE: 'wrong.name' }));
  assert.throws(() => configuration({ PORT: 'bad' }));
  assert.throws(() => configuration({ MONGODB_DNS_SERVERS: 'not-a-resolver' }));
  assert.deepEqual(configuration({ MONGODB_DNS_SERVERS: '1.1.1.1, 8.8.8.8' }).dnsServers, ['1.1.1.1', '8.8.8.8']);
  assert.equal(configuration({}).port, 4000);
});
test('private resources and privileged writes reject anonymous and buyer access', async () => {
  const { db, client } = fixture();
  await assert.rejects(readQuery(db, null, { table: 'profiles' }), { status: 401 });
  await assert.rejects(readQuery(db, { id: 'buyer', role: 'buyer' }, { table: 'vendor_management_view' }), { status: 403 });
  await assert.rejects(mutateQuery({ db, client, user: { id: 'buyer', role: 'buyer' } }, { table: 'site_settings', operation: 'insert', values: { setting_key: 'name', setting_value: 'bad' } }), { status: 403 });
});
test('a seller cannot update another seller inventory or award verification', async () => {
  const { db, client, rows } = fixture({ users: [{ id: 'seller', role: 'vendor', vendor_status: 'approved' }], products: [{ id: 'p', vendor_id: 'other', stock: 3 }], profiles: [{ id: 'profile', user_id: 'seller' }] });
  const ctx = { db, client, user: { id: 'seller', role: 'vendor', vendor_status: 'approved' } };
  await assert.rejects(mutateQuery(ctx, { table: 'products', operation: 'update', values: { stock: 50 }, filters: [{ field: 'id', op: 'eq', value: 'p' }], single: 'one' }), { code: 'PGRST116' });
  assert.equal(rows('products')[0].stock, 3);
  await assert.rejects(mutateQuery(ctx, { table: 'profiles', operation: 'update', values: { verified: true }, filters: [{ field: 'user_id', op: 'eq', value: 'seller' }] }), { status: 403 });
});

test('writes recheck account status inside the transaction after a seller is suspended', async () => {
  const f = fixture({ users: [{ id: 'seller', role: 'vendor', vendor_status: 'suspended' }], products: [{ id: 'p', vendor_id: 'seller', stock: 4 }] });
  await assert.rejects(mutateQuery({ ...f, user: { id: 'seller', role: 'vendor', vendor_status: 'approved' } }, {
    table: 'products', operation: 'update', values: { stock: 10 }, filters: [{ field: 'id', op: 'eq', value: 'p' }],
  }), { status: 403 });
  assert.equal(f.rows('products')[0].stock, 4);
});
