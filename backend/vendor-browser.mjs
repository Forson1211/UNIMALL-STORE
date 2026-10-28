/* global document, window */
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect as baseExpect } from '@playwright/test';
import { createServer } from 'vite';
const expect = baseExpect.configure({ timeout: 30000 });

export async function verifyVendorBrowser({ config, apiUrl, password }) {
  const previousApi = process.env.VITE_API_URL;
  process.env.VITE_API_URL = '/api';
  const vite = await createServer({ configFile: fileURLToPath(new URL('../frontend/vite.config.ts', import.meta.url)), mode: 'test', logLevel: 'error',
    server: { host: '127.0.0.1', port: 8081, strictPort: true, proxy: { '/api': apiUrl.replace(/\/api$/, '') } } });
  let browser, page, store;
  const directory = new URL('../.local/vendor-acceptance/', import.meta.url);
  const errors = [];
  try {
    await vite.listen(); await mkdir(directory, { recursive: true });
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
    const vendor = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    page = await vendor.newPage(); page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(30000);
    const origin = config.origin;
    await page.goto(origin + '/signup?role=vendor');
    await page.getByPlaceholder('e.g. John Doe').fill('UI Campus Seller');
    await page.locator('input[type=email]').fill('ui-seller@vendor.test');
    await page.getByPlaceholder('Minimum 8 characters').fill(password);
    await page.getByPlaceholder("e.g. Apex Tech Hub, Nana's Bakery, campus shoes...").fill('UI Campus Store');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 30000 });
    async function login(target, email) {
      await target.goto(origin + '/login');
      await target.locator('input[type=email]').fill(email);
      await target.locator('input[type=password]').fill(password);
      await target.getByRole('button', { name: /sign in/i }).click();
      await expect(target).not.toHaveURL(/\/login$/, { timeout: 30000 });
    }
    await login(page, 'ui-seller@vendor.test');
    await expect(page.getByRole('heading', { name: 'Approval Pending' })).toBeVisible({ timeout: 30000 });
    await page.getByRole('link', { name: 'Complete store profile' }).click();
    await expect(page.getByRole('button', { name: 'Save Store Details' })).toBeVisible();
    await page.getByPlaceholder('e.g. Legon TechHub').fill('UI Campus Store');
    await page.getByPlaceholder('e.g. 024 123 4567').fill('0241234567');
    await page.locator('textarea').first().fill('Books and essentials for students on campus.');
    await page.getByRole('combobox').filter({ hasText: 'Select Campus' }).click();
    await page.getByRole('option', { name: /University of Ghana/ }).first().click();
    const bytes = Buffer.from(await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200;
      const context = canvas.getContext('2d'); context.fillStyle = '#ff5500'; context.fillRect(0, 0, 400, 200);
      context.fillStyle = '#fff'; context.font = '24px sans-serif'; context.fillText('Campus Store', 30, 100);
      return canvas.toDataURL('image/png').split(',')[1];
    }), 'base64');
    const image = { name: 'store.png', mimeType: 'image/png', buffer: bytes };
    for (const index of [0, 1]) {
      const saved = page.waitForResponse(response => response.url().endsWith('/api/query') && response.request().postDataJSON()?.table === 'profiles' && response.request().postDataJSON()?.operation === 'update' && response.status() === 200);
      await page.locator('input[type=file]').nth(index).setInputFiles(image); await saved;
    }
    await expect(page.getByPlaceholder('e.g. 024 123 4567')).toHaveValue('0241234567');
    const profileSaved = page.waitForResponse(response => response.url().endsWith('/api/query') && response.request().postDataJSON()?.table === 'profiles' && response.request().postDataJSON()?.operation === 'update' && response.status() === 200);
    await page.getByRole('button', { name: 'Save Store Details' }).click(); await profileSaved;
    await page.screenshot({ path: fileURLToPath(new URL('pending-profile.png', directory)), fullPage: true, timeout: 15000 });
    const user = await page.evaluate(async () => (await (await fetch('/api/auth/user')).json()).user);
    await page.goto(origin + '/vendors/' + user.id);
    await expect(page.getByText('Your store preview', { exact: true })).toBeVisible();
    const guest = await browser.newContext(); store = await guest.newPage(); store.setDefaultTimeout(30000);
    store.on('pageerror', error => errors.push(error.message));
    await store.goto(origin + '/vendors');
    await expect(store.getByText('UI Campus Store', { exact: true })).toHaveCount(0);
    const admin = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const adminPage = await admin.newPage(); adminPage.setDefaultTimeout(30000); adminPage.on('pageerror', error => errors.push(error.message));
    await login(adminPage, 'admin@vendor.test'); await adminPage.goto(origin + '/admin/vendors');
    await adminPage.getByRole('button', { name: 'Actions for UI Campus Store' }).click();
    await adminPage.getByRole('menuitem', { name: 'Review vendor profile' }).click();
    await expect(adminPage.getByRole('dialog')).toContainText('0241234567');
    await adminPage.getByRole('dialog').getByRole('button', { name: 'Approve Vendor' }).click();
    await expect(adminPage.getByRole('row').filter({ hasText: 'ui-seller@vendor.test' })).toContainText('Approved');
    // This page was already open before approval: it must refresh without a reload.
    await expect(store.getByText('UI Campus Store', { exact: true }).first()).toBeVisible({ timeout: 35000 });
    await page.goto(origin + '/vendor/products');
    await page.getByRole('button', { name: 'Notifications', exact: true }).click();
    await expect(page.getByRole('menuitem').filter({ hasText: 'Store approved' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /add product/i }).first().click();
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    await dialog.locator('#name').fill('UI Campus Notebook');
    await dialog.locator('#price').fill('20'); await dialog.locator('#stock').fill('4');
    await dialog.locator('#category').click(); await page.getByRole('option', { name: 'Home & Office', exact: true }).click();
    await dialog.locator('#description').fill('A notebook published through the vendor browser flow.');
    const uploaded = page.waitForResponse(response => /\/api\/storage\/products$/.test(response.url()) && response.status() === 201);
    await dialog.locator('input[type=file]').first().setInputFiles(image); await uploaded;
    await page.getByRole('button', { name: /^publish product/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 30000 });
    await expect(page.getByText('UI Campus Notebook', { exact: true }).first()).toBeVisible();
    await store.goto(origin + '/vendors/' + user.id);
    await expect(store.getByText('UI Campus Notebook', { exact: true }).first()).toBeVisible({ timeout: 30000 });
    await store.screenshot({ path: fileURLToPath(new URL('published-store.png', directory)), fullPage: true, timeout: 15000 });
    const coupon = await page.evaluate(async () => (await (await fetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'coupons', operation: 'insert', values: { code: 'UI10', discount_type: 'percentage', discount_value: 10, status: 'active', usage_limit: 5 } }) })).json()));
    expect(coupon.error).toBeNull();
    await store.getByText('UI Campus Notebook', { exact: true }).first().click();
    await expect(store).toHaveURL(/\/products\//);
    const productUrl = store.url();
    await store.goto(origin + '/signup?role=buyer');
    await store.getByPlaceholder('e.g. John Doe').fill('UI Campus Buyer');
    await store.locator('input[type=email]').fill('ui-buyer@vendor.test');
    await store.getByPlaceholder('Minimum 8 characters').fill(password); await store.getByRole('checkbox').check();
    await store.getByRole('button', { name: /create account/i }).click(); await expect(store).toHaveURL(/\/login$/);
    await login(store, 'ui-buyer@vendor.test'); await store.goto(productUrl);
    await store.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();
    await store.goto(origin + '/cart');
    await store.getByPlaceholder('Enter a store or platform code').fill('UI10'); await store.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(store.getByText('Discount (UI10)', { exact: true })).toBeVisible({ timeout: 30000 });
    await store.getByRole('button', { name: /proceed to checkout/i }).click();
    await store.getByLabel('Delivery phone number').fill('0241234567');
    await store.getByPlaceholder('Full Name', { exact: true }).fill('UI Campus Buyer');
    await store.getByPlaceholder('House number and street name').fill('Campus hostel room 4');
    await store.getByPlaceholder('City', { exact: true }).fill('Accra'); await store.locator('select[name=region]').selectOption('Greater Accra');
    await store.getByRole('button', { name: 'Continue to Payment' }).click();
    await store.getByRole('button', { name: 'Continue to Review' }).click();
    await expect(store.getByRole('button', { name: /place order/i })).toContainText('18.00');
    await store.screenshot({ path: fileURLToPath(new URL('discounted-checkout.png', directory)), fullPage: true, timeout: 15000 });
    const submitted = store.waitForResponse(response => response.url().endsWith('/api/actions/create_order_v2'));
    await store.getByRole('button', { name: /place order/i }).click();
    const confirmation = await (await submitted).json(); expect(confirmation.error).toBeNull(); expect(confirmation.data).toBeTruthy();
    await expect(store).toHaveURL(/\/account\/orders\?order=/);
    await expect(store.getByText('GHS 2.00 saved at checkout.', { exact: false })).toBeVisible({ timeout: 30000 });
    await store.getByRole('button', { name: 'Cancel order', exact: true }).click();
    await store.getByRole('alertdialog').getByRole('button', { name: 'Cancel order', exact: true }).click();
    await expect(store.getByText('cancelled', { exact: true }).first()).toBeVisible({ timeout: 30000 });
    const stock = await page.evaluate(async () => (await (await fetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'products', selection: 'stock', filters: [{ field: 'name', op: 'eq', value: 'UI Campus Notebook' }], single: 'one' }) })).json()).data.stock);
    expect(stock).toBe(4);
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(origin + '/vendor/orders');
    await expect(page.getByRole('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: fileURLToPath(new URL('mobile-orders.png', directory)), fullPage: true, timeout: 15000 });
    expect(errors).toEqual([]);
    await rm(new URL('failure.png', directory), { force: true });
    await rm(new URL('buyer-failure.png', directory), { force: true });
    console.log('Browser acceptance: signup, owner preview, live approval refresh, publication, coupon checkout, buyer cancellation, restored stock and mobile orders passed.');
  } catch (error) {
    console.error('Browser acceptance failed: ' + error.message);
    if (store) await store.screenshot({ path: fileURLToPath(new URL('buyer-failure.png', directory)), fullPage: true, timeout: 5000 }).catch(() => {});
    if (page) await page.screenshot({ path: fileURLToPath(new URL('failure.png', directory)), fullPage: true, timeout: 5000 }).catch(() => {});
    throw error;
  } finally {
    if (browser) await browser.close();
    vite.httpServer?.closeAllConnections(); await vite.close();
    if (previousApi === undefined) delete process.env.VITE_API_URL; else process.env.VITE_API_URL = previousApi;
  }
}
