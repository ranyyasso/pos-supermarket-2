# Local database implementation

## Running now

- Supabase API: http://127.0.0.1:55321
- PostgreSQL: 127.0.0.1:55322
- Supabase Studio: http://127.0.0.1:55323
- Project: pos_supermarket_2; separate ports preserve the other local stack.
- PostgreSQL 17; migrations and synthetic seed applied successfully.

## Implemented and tested

Three ordered SQL migrations provide store-scoped catalog, identities, sales, payments, receiving, refunds, stock ledger, supporting loyalty/coupon tables and a sales summary view. Composite foreign keys prevent references to other stores. Exposed tables have RLS; browser clients cannot directly write business records.

RPCs: register_product, post_receipt, checkout, refund_sale, void_sale. Writes are transactional and use request UUID + payload matching to prevent duplicate posting. Checkout validates stock under locks, derives prices on the server, and accepts simulated payments only. Receiving updates latest cost; sale items keep their cost snapshot. Refunds allocate back to original payments; voids create payment reversals and restore stock once.

Manager-only RPCs currently require the authenticated manager's own session. There are no demo PINs or client-issued approval flags in this backend.

Seed: the app's 21 synthetic products with original legacy IDs, prices, stock and category colors. No saved browser data was imported. No permanent staff account/password was created. Supabase Auth/REST tests use a temporary account and remove it afterward.

`src/database/client.ts` provides an explicit Supabase client/repository entry point. The app still uses the existing local-storage demo, as cloud connection was requested for later. No automatic mode switch or silent dual-write is enabled.

## Connection gate — still required before switching the app

This is a tested database foundation, not feature-complete parity with every current UI operation:

- Basic checkout does not yet implement automatic juice promotion, coupons, discounts, reward allocations, wholesale policy, scale-barcode parsing, or draft/partial-payment persistence. The supporting tables are present, but those posting paths are not enabled. Unknown pricing fields are rejected.
- Basic checkout rounds per line. The current UI rounds tax by group; implement and regression-test identical pricing/allocation rules before connecting checkout.
- No delegated, expiring approval-token flow yet. A cashier cannot impersonate a manager; manager-only operations need an actual manager session. Add an approval service before preserving cashier-session approvals.
- No editable product/supplier/customer admin RPCs yet; seed/admin access provisions reference records. No import execution or offline posting is enabled.
- Sale item/cost ledger access is manager-only. Add a cashier-safe receipt projection without cost before wiring receipts.
- Supporting loyalty/coupon tables are read-only pending business-rule RPCs. Expiry is recorded per receipt line; lot balance tracking is not claimed.
- Add reporting views for all current date-range/profit/CSV workflows, including unknown historical costs and period reversals. sales_summary is only a lifetime per-sale summary.

These gates keep the existing demo intact and prevent the incomplete basic checkout from silently changing financial behavior.

## Verification

- `npm run db:test`: embedded PostgreSQL migration + integrity tests.
- With MIZAN_TEST_POSTGRES=1, the same test creates a uniquely named disposable database on this local stack, runs all migrations/tests plus concurrent checkout checks, and removes only that database.
- `node --test tests/supabase-api.test.mjs`: local Auth/REST access test; refuses any URL except this project's localhost API.
- Existing app checks: unit tests, isolated browser regressions, typecheck and production build.

The SQL tests cover invalid cross-store relationships, duplicate barcode rejection, manager/cashier/anonymous/disabled access, retry payload matching, rollback, receiving cost snapshot, checkout stock deduction, over-refund rejection, payment allocation, void reversal and insufficient stock. Real PostgreSQL additionally verifies simultaneous checkout cannot oversell.

Commands are recorded for maintainers; the local stack has already been started by the agent. Use versioned migrations for further changes. Do not reset or push to an existing remote project without a separate migration review and backup/import plan.

## Secrets

Only a publishable key and authenticated user session belong in browser configuration. Secret/service-role keys stay server-side. No cloud credentials have been added. CLI status can display local credentials; tests consume them in memory without logging them.
