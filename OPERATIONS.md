# Operating Unimall

The app uses `frontend/` for React and `backend/` for the MongoDB API. Run npm commands from the repository root. Database credentials belong in `backend/.env`; keep that file private. The frontend uses `/api` by default.

The Vendors page imports its banner directly from `frontend/dist/Images/5.png`; the Shop banner uses `frontend/dist/Images/6.png`. Replace these files to update the banners automatically while the Vite development server is running. These source images are explicitly included in Git and Docker despite their folder name; the production build output remains the separate root `dist/` directory. Changes to the live site require a new build and deployment, which gives each image a new cache-busting asset URL.

The first homepage hero slide similarly imports `frontend/dist/Images/4.png` directly, with its text and Shop Now button on the right on desktop. The student stores slide imports `frontend/dist/Images/1.png`, with its copy on the left and a link to `/vendors`. Replace either file to update its slide locally; build and redeploy for the live site.

The homepage phone promotion imports `frontend/dist/Images/2.png` directly and links to the Phones & Tablets category. It follows the same local update and deployment workflow.

## Local startup

1. Install Node.js 22.12 or newer and run `npm ci`.
2. Copy `backend/.env.example` to `backend/.env` if it does not exist. Set `MONGODB_URI` to your Atlas connection string and choose `MONGODB_DATABASE`.
3. Atlas must allow this machine's IP address and the database user must have read/write access. Leave `MONGODB_DNS_SERVERS` blank normally. Atlas startup probes system DNS, then Cloudflare and Google if needed. An explicit override is tried first. This affects only the Node process and does not change OS DNS.
4. Set `SEED_ADMIN_EMAIL` and optionally `SEED_ADMIN_PASSWORD`; run `npm run db:seed`. Seeding preserves existing accounts, passwords and commerce data. Without a password, the generated credentials are written under ignored `.local/credentials/`.
5. Start `npm run server:dev` and `npm run dev` in separate terminals. Open `http://localhost:8080`.

On PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

## Opening a store and selling

- New vendors register at `/signup?role=vendor`, sign in and complete `/vendor/profile`. A pending vendor can preview its own store, but only approved vendors appear publicly or sell.
- Administrators approve stores in `/admin/vendors`. Approval and verification badges are separate actions.
- An administrator can also operate a store using the Seller Dashboard. Saving a nonempty store name makes that administrator's storefront discoverable; unnamed administrative accounts are excluded.
- Before adding products, save the store name, contact phone, campus, description, logo and banner. Publish products with a positive price, whole-number stock and a product image.
- A published product appears in `/products` and `/vendors/:userId`. Approval, inventory and storefront pages refresh while open.
- Sellers confirm orders, mark them shipped and then delivered. Buyers can cancel unpaid orders before any item is dispatched. Cancellation restores stock once. Sellers can cancel their own eligible lines in mixed-store orders.
- Order staff record collected cash for delivered COD orders in `/admin/orders`. Payouts use delivered, collected earnings, less pending/approved/paid payouts. Staff payout approval and settlement record transfers; the site does not initiate a bank or MoMo transfer.

## Prices and discounts

Cart and checkout request current prices and stock from the API. Active, administrator-approved flash deals apply during their saved time window. Checkout revalidates everything in a transaction.

Buyers may use one active coupon per order. A vendor code discounts only that vendor's products; an administrator code applies across stores. Discounts apply after flash-deal pricing, are capped at the eligible subtotal, and are allocated to individual lines to keep cancellation, reports and earnings consistent. Dates and usage limits are enforced on the server. End dates entered as calendar dates include that entire day in UTC. A coupon use is consumed by a successful order, including an order later cancelled; retries of the same order do not consume another use.

## Checks

```sh
npm run typecheck
npm test -- --maxWorkers=1
npm run test:server
npm run lint -- --quiet
npm run build
npm run backend:check
npm run test:db
npm run test:vendor -- --browser
```

The last two commands use the configured Atlas connection but create randomly named temporary databases and remove only their own databases. Browser acceptance requires Microsoft Edge, or a supported Playwright channel supplied through `PLAYWRIGHT_CHANNEL`. Screenshots are saved under `.local/vendor-acceptance/`.

## Production

Run `npm run build`, then `npm start` with `NODE_ENV=production`, an HTTPS `APP_ORIGIN`, `MONGODB_URI`, `MONGODB_DATABASE` and `PORT`. The Node server serves `dist/`, SPA routes and `/api` together. Set `TRUST_PROXY=true` only when running behind a trusted reverse proxy. Static frontend hosting alone does not run the API.

Alternatively build the supplied Dockerfile and supply those environment variables to the container. Environment files and local credentials are excluded from its build context. Container builds need network access to npm and Atlas must allow the deployed service's outbound IP.

Current payment support is cash on delivery. Online payment credentials can be added in a later integration. Password recovery emails require `SMTP_URL` and `MAIL_FROM`; enable `REQUIRE_EMAIL_VERIFICATION` only after mail is configured. No fake products, customers or orders are seeded into the live database.

## Validation on 26 October 2026

- 78 frontend tests and 29 server unit/HTTP tests passed. The two external scenarios skipped by the default server command were run separately against Atlas.
- Atlas concurrency checks passed for stock reservations, transaction rollback, duplicate retries and the final available coupon redemption.
- The API acceptance scenario passed store registration/approval, publishing, mixed-vendor fulfillment, collected earnings/payouts, reviews, suspension, administrator storefronts, private follows, coupons, flash pricing and cancellation.
- Microsoft Edge desktop/mobile acceptance passed signup, pending owner preview, automatic directory refresh after approval, profile/image uploads, publishing, storefront browsing, discounted COD checkout, buyer order history/cancellation and stock restoration. Temporary databases were removed afterwards.
- TypeScript, lint with `--quiet`, production build, running API health and direct Atlas connectivity passed. Docker packaging is provided; the container build was not executed here.
- The real Forson storefront was checked while signed out and is publicly visible locally. It has no published products yet; use `/vendor/products` to add the first listing.

Local acceptance screenshots are under `.local/vendor-acceptance/`; the real store screenshots are under `.local/live-store/`.
