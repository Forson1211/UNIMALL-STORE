import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedDatabase } from '../seed-data.mjs';
import { verifyPassword } from '../security.mjs';
import { fixture } from './fixtures.mjs';
import { mutateQuery } from '../queries.mjs';

test('seed creates one initial admin and is repeatable without replacing content or passwords', async () => {
  const f = fixture();
  const first = await seedDatabase(f, { adminEmail: 'owner@example.com', adminPassword: 'initial-password' });
  assert.equal(first.administrator, 'created');
  assert.ok(first.added.settings > 20);
  assert.equal(first.added.pages, 4); assert.equal(first.added.menus, 2);
  const user = f.rows('users')[0];
  assert.equal(await verifyPassword('initial-password', user.password_hash), true);
  assert.equal(f.rows('profiles')[0].user_id, user.id);
  f.rows('site_settings').find(row => row.setting_key === 'site_name').setting_value = 'Custom store';
  f.rows('site_pages').find(row => row.slug === 'about').content = { html: '<p>Custom about page</p>' };
  f.rows('navigation_menus')[0].menu_name = 'Custom navigation';
  const second = await seedDatabase(f, { adminEmail: 'different@example.com', adminPassword: 'replacement-password' });
  assert.equal(second.administrator, 'preserved');
  assert.deepEqual(second.added, { settings: 0, pages: 0, menus: 0 });
  assert.equal(f.rows('users').length, 1);
  assert.equal(f.rows('users')[0].password_hash, user.password_hash);
  assert.equal(f.rows('site_settings').find(row => row.setting_key === 'site_name').setting_value, 'Custom store');
  assert.equal(f.rows('site_pages').find(row => row.slug === 'about').content.html, '<p>Custom about page</p>');
  assert.equal(f.rows('navigation_menus')[0].menu_name, 'Custom navigation');
  assert.equal(f.rows('site_pages').find(row => row.slug === 'privacy').is_published, false);
  assert.equal(f.rows('products').length, 0); assert.equal(f.rows('orders').length, 0);
});
test('seed promotes an existing account without resetting its password or profile', async () => {
  const f = fixture({ users: [{ id: 'owner', email: 'owner@example.com', role: 'buyer', password_hash: 'existing-hash' }],
    profiles: [{ id: 'profile', user_id: 'owner', full_name: 'Original Name' }], sessions: [{ id: 's', user_id: 'owner' }] });
  const result = await seedDatabase(f, { adminEmail: 'owner@example.com' });
  assert.equal(result.administrator, 'promoted');
  assert.equal(f.rows('users')[0].password_hash, 'existing-hash');
  assert.equal(f.rows('profiles')[0].full_name, 'Original Name');
  assert.equal(f.rows('sessions').length, 0);
});
test('seed refuses missing admin email and disabled accounts without partial seed records', async () => {
  const empty = fixture();
  await assert.rejects(seedDatabase(empty), { status: 400 });
  assert.equal(empty.rows('site_settings').length, 0);
  const disabled = fixture({ users: [{ id: 'old', email: 'owner@example.com', disabled: true }] });
  await assert.rejects(seedDatabase(disabled, { adminEmail: 'owner@example.com' }), { status: 409 });
  assert.equal(disabled.rows('site_pages').length, 0);
});
test('generated admin password must be saved successfully before account creation', async () => {
  const f = fixture(); let credentials;
  await assert.rejects(seedDatabase(f, { adminEmail: 'owner@example.com', saveCredentials: async () => { throw new Error('Disk write denied'); } }), /Disk write denied/);
  assert.equal(f.rows('users').length, 0);
  await seedDatabase(f, { adminEmail: 'owner@example.com', saveCredentials: async value => { credentials = value; } });
  assert.equal(credentials.email, 'owner@example.com');
  assert.ok(credentials.password.length >= 24);
  assert.equal(await verifyPassword(credentials.password, f.rows('users')[0].password_hash), true);
});
test('seeded menu fields match the editor contract and reject unsafe navigation URLs', async () => {
  const f = fixture({ users: [{ id: 'admin', role: 'admin' }] });
  const ctx = { ...f, user: { id: 'admin', role: 'admin' } };
  const menu = { menu_name: 'Campus links', menu_location: 'header', is_active: true, menu_items: [{ label: 'Shop', url: '/products' }] };
  await mutateQuery(ctx, { table: 'navigation_menus', operation: 'insert', values: menu });
  assert.equal(f.rows('navigation_menus')[0].menu_name, 'Campus links');
  await assert.rejects(mutateQuery(ctx, { table: 'navigation_menus', operation: 'insert', values: { ...menu, menu_items: [{ label: 'Bad', url: 'javascript:alert(1)' }] } }), { status: 400 });
});
