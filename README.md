# Unimall

Campus ecommerce marketplace built with React, TypeScript, Vite, Express and MongoDB Atlas.

The application lives in frontend/ and backend/. Run commands from the repository root. Keep database credentials in backend/.env; the frontend uses /api by default.

## Run locally

1. Install Node.js 22.12 or newer and run npm ci.
2. Configure backend/.env using backend/.env.example.
3. Set the initial administrator email and run npm run db:seed. Seeding preserves existing data and passwords.
4. Run npm run dev to start both backend and frontend together (or npm run dev:backend and npm run dev:frontend in separate terminals).
5. Open http://localhost:8080.

On Windows PowerShell, use npm.cmd if execution policy blocks npm.ps1.

## Selling and buying

Vendors register, complete their saved store profile, and await staff approval before publishing products. Administrators can also operate a named store from their Seller Dashboard. Public stores refresh automatically; pending vendors can preview their own store.

Buyers can browse, search, save products and place cash-on-delivery orders. Cart and checkout use server prices, active approved flash deals, and real platform/store coupon codes. Transactional checkout prevents overselling and duplicate orders. Buyers can cancel unpaid orders before dispatch; eligible cancellation restores stock once.

Vendors manage inventory, fulfillment, reviews, store profiles, delivery contacts, payout destinations and notifications. Order staff record collected cash after delivery. Payout requests reserve collected delivered earnings and staff record approval/settlement.

Online payments are deferred. Password recovery emails need SMTP_URL and MAIL_FROM. Payout settlement records a transfer performed by staff; it does not send money automatically. Approval and verified badges remain staff-controlled.

## Verification and production

Run npm run typecheck, npm test, npm run test:server, npm run lint -- --quiet, and npm run build. Real Atlas checks run with npm run test:db and npm run test:vendor -- --browser, using temporary databases only.

For production, npm run build creates dist/ and npm start serves the app and API together. The supplied Dockerfile packages both. An HTTPS APP_ORIGIN and Atlas access are required; static frontend hosting alone does not run the API.

See [OPERATIONS.md](OPERATIONS.md) for setup, approval, discount rules, acceptance tests and production environment configuration.
