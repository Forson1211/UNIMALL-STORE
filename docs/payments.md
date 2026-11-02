 # Payments, commission and Friday payouts

The implementation extends the existing orders and order items. Online finance uses Paystack hosted checkout, server verification, an append-only double-entry ledger, and reviewed payout batches. The buyer, seller and administrator screens are `/payment-return`, `/account/orders`, `/vendor/finance` and `/admin/finance`. The old payout screen now opens Finance; legacy manual payout actions and unverified payout-account writes are disabled in the deployed API.

New payments and payouts default to **disabled**. No provider credentials, live merchant approval, delayed settlement approval or real-money test results are implied by this implementation. Customer-facing screens must not describe the arrangement as escrow.

## Money and eligibility

All new financial amounts are integer GHS pesewas. Commission is snapshotted per discounted merchandise line using basis points, with half-up rounding: `(gross * bps + 5000) / 10000`, using integer arithmetic. The default is 500 bps (5%). A GHS 200 merchandise line produces GHS 10 commission and GHS 190 seller entitlement. Future settings changes cannot rewrite existing order snapshots.

Merchandise, delivery, tax, commission, provider fees and vendor liabilities remain separate. The platform bears processing and transfer fees. Estimates are labelled separately from provider-confirmed fees; fee corrections append journals rather than editing history. Balances are projections of balanced, idempotent ledger entries, checked during reconciliation.

Online earnings pass through these states:

1. Verified payment creates **pending** earnings. A callback URL or successful transfer HTTP response never settles money.
2. Seller records delivery. The buyer must separately confirm receipt in My Orders.
3. After the waiting period (48 hours by default), earnings become **eligible** if the seller is approved and no dispute/refund holds the item.
4. Friday at 10:00 Africa/Accra, earnings eligible at that cutoff are **reserved** as exact item allocations. Balances below GHS 20 carry forward.
5. An administrator confirms their current password and approves the batch. The worker submits each unique transfer reference once.
6. Only an independently verified provider success makes earnings **paid**. Pending, OTP, timeout and unknown transfers retain reservations. A confirmed failure releases only its own reservation.

The batch schedule key, journal key, payment reference, provider IDs, checkout request ID, refund request ID and webhook event key have unique indexes. MongoDB transactions use snapshot reads and majority writes. A shared finance write serializes financial decisions; actor and vendor writes conflict with concurrent suspension, permission or password changes.

## Provider setup and deployment

Use the variables in `backend/.env.example` and the deployment platform's secret store. Never add payment secrets to `VITE_*` variables.

| Variable | Purpose |
| --- | --- |
| `PAYMENTS_ENABLED` | Permit new online checkout; defaults false |
| `PAYOUTS_ENABLED` | Permit outbound transfer submission; defaults false |
| `PAYOUTS_REQUIRE_APPROVAL` | Approval is always enforced, including if this variable is false |
| `PAYSTACK_TEST_MODE` | Defaults true; credentials must have the matching test/live prefix |
| `PAYSTACK_SECRET_KEY` | Server-only provider key |
| `PAYSTACK_INTEGRATION_ID` | Additional provider merchant ownership check when configured |
| `PAYSTACK_CHANNELS` | Merchant-approved channels only; starts with `card` |
| `PAYMENT_CHANNELS_VERIFIED` | Required for live checkout |
| `PAYSTACK_BUSINESS_VERIFIED` | Required for live checkout |
| `PAYSTACK_TRANSFERS_VERIFIED` | Required for live transfers |
| `ESCROW_OR_DELAYED_SETTLEMENT_APPROVED` | Required for live checkout; obtain actual provider/regulatory approval first |
| `PAYOUT_ENCRYPTION_KEY` | 32 random bytes encoded as 64 hex characters; encrypts account details with AES-256-GCM |
| `FINANCE_CRON_SECRET` | Long random bearer credential for the scheduler endpoint |
| `CHECKOUT_EXPIRY_MINUTES` | Unpaid online inventory reservation lifetime; default 30 |
| `PLATFORM_COMMISSION_BPS` | Default 500; saved platform settings take precedence |
| `PAYOUT_MINIMUM_PESEWAS` | Default 2000 |
| `PAYOUT_WAITING_HOURS` | Default 48 |
| `COD_ENABLED` | Defaults true, subject to seller/category restrictions |

Generate secrets locally, keep a separate encrypted backup of the encryption key, and do not paste them into issues or commit them. Example key-generation command: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

Set the Paystack webhook URL to `https://YOUR_API_HOST/api/webhooks/paystack`. `APP_ORIGIN` must be the actual frontend origin so checkout returns to `/payment-return?payment=...`. Signed events are authenticated against exact raw bytes with HMAC-SHA512 before JSON parsing, durably queued, and acknowledged. Stored event records contain references rather than raw card or bank payloads. Polling and webhooks both verify the same saved provider reference.

Run a persistent worker alongside the API:

```sh
npm run finance:worker
```

For a scheduled environment, invoke `POST /api/internal/finance/run` every minute with `Authorization: Bearer <FINANCE_CRON_SECRET>`, or run `npm run finance:once`. The worker uses database leases and persistent jobs; API process restarts cannot discard pending payouts. Static frontend hosting does not run the worker. A Vercel deployment needs an authenticated scheduler capable of POST, or a separate persistent worker; do not expose the bearer secret in a public URL. Configure infrastructure timeouts for reconciliation workloads.

Daily reconciliation is queued automatically when provider credentials exist, including when new checkout is disabled. Administrator-triggered reconciliation is also queued to avoid long browser requests. Keep the worker running while disabling new checkout during an incident: verification and refunds remain available. Do not switch a populated finance database between test and live mode; use a separate test database and test merchant configuration.

## Refunds, disputes, COD and reconciliation

Buyers report item problems in My Orders. Open disputes and unresolved refunds hold the associated earnings. Administrators record a reason and current password for decisions/refunds. Item refunds use the original commission snapshot; partial refunds allocate commission deterministically and the final refund consumes the remaining rounding difference. Delivery/tax refunds debit their own liabilities. Refunds do not restore stock automatically: arrange returns and inspect stock separately.

Provider submission is never repeated after an unknown response. Match a lost refund response using its exact internal merchant note and provider refund ID, then verify its amount, currency and original transaction. A completed refund reduces pending/eligible seller liability; an already-paid refund creates a separate seller debt. Reserved payouts must be cancelled before submission or reconciled before refunding those items.

Provider disputes create holds. The administrator's **Verify provider resolution** action fetches the actual provider dispute: resolved declines release the hold; confirmed merchandise chargebacks allocate the loss once without issuing a second refund. Reserved payouts, conflicting earlier refunds or chargebacks exceeding remaining merchandise require review instead of a guessed allocation. Confirm any delivery/tax portion separately with provider support before making a charges refund; never issue another refund for money already returned through a chargeback.

A previously successful transfer that reverses restores its liability into reservation and raises a reconciliation hold. **Restore verified reversal** requires fresh administrator authentication and another provider verification before returning those earnings to eligibility. Any subsequent payout uses a new reviewed batch and reference. Conflicting non-reversal statuses cannot release paid earnings.

COD never adds online earnings or provider cash. The seller confirms cash receipt; the buyer separately confirms delivery and cash payment; order staff then record verified collection. The snapshotted commission becomes a seller receivable. Administrators record external commission/debt receipts against that exact receivable with an auditable bank receipt reference. Automatic COD offsets are disabled; contractual authorization has not been assumed. COD can be restricted by seller/category, individual seller opt-out and maximum outstanding commission.

Reconciliation checks internal payments/transfers/refunds, provider transaction/transfer/settlement lists, provider GHS balance, balanced journals and ledger account projections. Unmatched entries and unresolved jobs block new transfers. A clean report supersedes older daily discrepancy reports; entity-specific holds require successful verification. Issues cannot be dismissed with an unchecked “mark paid” action.

Platform funding and bank settlements can be mapped by exact provider balance ledger ID. The server fetches the entry and verifies its currency, mode, direction and merchant. These movements use platform funding/bank receipt accounts, not seller earnings. Transaction, transfer, refund and dispute movements must use their original workflows. Use a dedicated merchant account: unrelated provider activity and historical opening balances need a separately reviewed migration, not invented customer orders. Provider settlement to a bank does not mean cash is available for transfers; fund the provider balance under the approved merchant arrangement and reconcile it first.

Reconciliation limits (200 internal payments, 200 transfers, 100 refunds, 1,000 entries per provider list per run) are fail-closed review limits. A volume-limit issue must be addressed before transfers resume; increase capacity or implement a verified cursor-based backfill for higher traffic. There is no silent assumption that unexamined records match.

The Jobs tab exposes persistent failures and safe verification retries. Retrying an unknown transfer/refund checks its existing reference rather than initiating another payment. Review provider-side OTP, insufficient balance, rejected recipients and rejected/unknown refund statuses before retrying.

## Migration and rollback

Back up MongoDB and the encryption key first. Review the dry run, then explicitly apply:

```sh
npm run finance:migrate
npm run finance:migrate -- --apply
```

The migration labels legacy orders/items `finance_version: 0`, encrypts old destination details and payout destination snapshots, masks their old plaintext fields, and marks destinations for reverification. It does **not** fabricate verified payments, reconstruct old commission or credit historical earnings. It is repeatable. New finance collections and unique indexes are initialized by the API, worker and migration connection. Legacy outstanding obligations require a documented opening-balance reconciliation before live launch.

Rollback begins by setting `PAYMENTS_ENABLED=false` and `PAYOUTS_ENABLED=false`. Keep verification/reconciliation available. Do not delete journals, reservations or provider references, restore plaintext destinations, or revert to manual “paid” actions. Roll back code only after reconciling outstanding external requests; use a consistent database backup and matching encryption key if database restoration is necessary. Restore provider-side state separately rather than assuming a database restore undoes a transfer.

## API contract

All paths below have the `/api` prefix. Responses use `{ data, error }`; list responses contain `{ rows, total, page, limit }` with `page >= 1` and `limit <= 100`. List endpoints accept `status` and administrators can filter `vendor_id`. Authentication uses the existing session cookie and origin guard. Money-changing endpoints have a separate rate limit. Protected administrator/vendor account changes require `password` in the JSON body. Errors preserve HTTP status and safe messages; each HTTP response includes `X-Request-ID` for tracing.

| Method and path | Role and payload |
| --- | --- |
| `GET /payments/config` | Public; safe enabled-channel configuration |
| `POST /checkout` | Signed-in buyer; `request_id`, `payment_method: paystack/cod`, `items: [{id, quantity}]`, `shipping_details`, optional `coupon_code` |
| `GET /payments/:id` | Owning buyer or finance administrator |
| `POST /payments/:id/verify` | Owning buyer or finance administrator; independent provider verification |
| `GET /orders/:id/payment` | Owning buyer; recover payment reference from order history |
| `POST /orders/items/:id/confirm-delivery` | Owning buyer; optional explicit `cash_paid: true` for COD |
| `POST /disputes` | Owning buyer; `order_item_id`, `reason` |
| `POST /vendor/cod/:id/confirm` | Owning approved seller; delivered COD items only |
| `GET /vendor/finance/summary` | Approved seller; pending, eligible, reserved, paid, debt, COD and masked account |
| `GET /vendor/earnings`, `GET /vendor/payouts` | Approved seller; own paginated records |
| `GET /vendor/payout-banks?type=ghipss/mobile_money` | Approved seller; provider Ghana bank/network list |
| `POST /vendor/payout-account` | Approved seller; password, type, name, account_number, bank_code; encrypted storage and provider verification |
| `GET /admin/finance/overview` | `admin` or existing `super_admin` |
| `GET /admin/payout-batches`, `/admin/payouts`, `/admin/refunds`, `/admin/disputes`, `/admin/reconciliation` | Finance administrators; paginated |
| `GET /admin/finance/earnings`, `/admin/finance/ledger`, `/admin/finance/audit`, `/admin/finance/jobs` | Finance administrators; audit is finance-only |
| `POST /admin/payout-batches/run` | Password; prepare current Friday cutoff idempotently |
| `POST /admin/payout-batches/:id/approve` | Password; review, lock and queue the batch |
| `GET /admin/payout-batches/:id/report.csv` | Finance administrator; escaped CSV, integer amounts |
| `POST /admin/payouts/:id/cancel` | Password; unsubmitted reservations only |
| `POST /admin/payouts/:id/reconcile` | Password; verify exact saved transfer reference |
| `POST /admin/payouts/:id/resolve-reversal` | Password; restore only a verified reversal |
| `POST /admin/refunds` | Password, request_id, reason, amount_pesewas and order_item_id; alternatively payment_id for delivery/tax charges |
| `POST /admin/refunds/:id/reconcile` | Password; optional provider_id to recover an unknown response with exact matching evidence |
| `POST /admin/disputes/:id/resolve` | Password, reason, decision: seller/buyer_refund_required |
| `POST /admin/disputes/:id/verify-provider` | Password; fetch actual provider dispute outcome |
| `PATCH /admin/finance/settings` | Password and validated future-order settings |
| `POST /admin/finance/cod/:id/collect` | Order staff; buyer/seller cash and delivery confirmations required |
| `POST /admin/finance/receivables/collect` | Password, vendor_id, kind: cod/refund_debt, reference, amount_pesewas |
| `POST /admin/reconciliation/run` | Password; queues a reconciliation job |
| `POST /admin/reconciliation/provider-movement` | Password, provider_ledger_id, kind: funding/settlement, reason |
| `POST /admin/finance/jobs/:id/retry` | Password; safely retry pending/review-required jobs |
| `POST /webhooks/paystack` | Exact raw JSON and valid X-Paystack-Signature; no browser session |
| `POST /internal/finance/run` | Scheduler bearer credential; distributed lease |

`finance_settings` permits commission/minimum/wait/delivery/tax settings, COD enabled/seller/category lists and receivable cap, plus separately labelled fee estimates. Client-supplied totals, commission, vendor ownership, balances or recipient verification status are never authoritative.

Collections: `payments`, `vendor_earnings`, `ledger_accounts`, `ledger_entries`, `payout_accounts`, `payout_batches`, `payouts`, `refunds`, `disputes`, `webhook_events`, `provider_reconciliations`, `finance_jobs`, `finance_settings`. Existing `orders`, `order_items`, `transactions`, `users`, `notifications` and `system_logs` remain integrated. Generic query mutations cannot write the financial collections.

## Verification and activation checklist

```sh
npm run typecheck
npm run lint -- --quiet
npm test -- --maxWorkers=1
npm run test:server
npm run finance:test-db
npm run build
```

`finance:test-db` uses the configured MongoDB URI or `TEST_MONGODB_URI`, a random isolated database, and an injected fake provider; it removes only its own database. It tests concurrent checkout/verification, batch reservation/approval, worker claims and simultaneous refunds. Unit/HTTP tests cover authorization, raw signatures, commissions, account encryption, expiry, dispute holds, minimums, suspension, timeouts, duplicate/out-of-order statuses, post-payout debts, migration, actual-fee corrections and reconciliation mismatches. Frontend tests cover untrusted callback status, verified cart clearing, changed carts, delivery confirmation and COD consent.

Before live activation, obtain merchant/channel/transfer and delayed-settlement approval, configure secrets and webhook delivery, apply/review the legacy migration, deploy and monitor the worker, verify bank/MoMo name resolution and transfer/OTP settings, test actual Paystack sandbox checkout/webhooks/refunds/transfers, reconcile balances/fees/settlements, and conduct a limited approved live acceptance test. Actual provider sandbox/live testing requires the merchant credentials and account access; fake-provider tests do not replace it.

Provider contracts checked against the official [payments documentation](https://paystack.com/docs/payments/accept-payments/), [webhooks](https://paystack.com/docs/payments/webhooks/), [transfer verification](https://paystack.com/docs/api/transfer/), [transfer recipients](https://paystack.com/docs/api/transfer-recipient/), [refunds](https://paystack.com/docs/api/refund/), [settlements](https://paystack.com/docs/api/settlement/), [disputes](https://paystack.com/docs/api/dispute/) and [provider balance ledger](https://paystack.com/docs/api/transfer-control/).
