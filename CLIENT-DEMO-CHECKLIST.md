# Client demo verification

Verified locally on 14 September 2026. The Docker app is available at http://127.0.0.1:18173/.

## Result

39 unit/regression tests passed. The pricing regression includes 500 varied baskets. All 36 isolated Chromium browser scenarios passed twice (72 successful runs), with no page errors or console errors captured in the full-audit scenarios. TypeScript, production build and four Sites packaging tests passed. The `mizan-pos-pos-1` container is healthy.

No known failing scenario remains in the tested desktop demo. This does not guarantee every possible input, device or external integration is error-free. Physical devices and production services are outside the verified boundary.

## Feature coverage

| Feature | Evidence |
| --- | --- |
| Categories, product search, Arabic barcode input, keyboard-wedge scan | Browser tests; no extra add from empty Enter or scanner Enter |
| Basket add, quantity +/−, direct quantity, notes, remove and undo | Browser tests; quantity constrained to 1–999 |
| Price check | Known name/barcode, unknown barcode, reset, no basket mutation |
| Item/basket discounts and manager approval | Invalid values, item percent, basket percent, removal; integer fixed amounts validated |
| Promotions/coupons | Cola pairs, separate-line pairs, welcome coupon, dessert threshold/scope, expired/unknown codes, stacking rejection |
| Customer/loyalty | Card search, attach/detach, new customer, phone validation/duplicates, points adjustment, redemption/cancellation |
| Age verification | Refusal, identity confirmation, manager override |
| Subtotal, discounts, tax and total | Integer calculations, tax-rate group rounding, 500 varied baskets, immutable pricing snapshots |
| Cash/card/contactless | Invalid/insufficient/exact cash, change, approval, decline, timeout, cancellation and retry |
| Split payment | Partial cash, card completion, reload recovery, blocked exit and manager reversal |
| Hold/recall | Notes, search, full basket restoration and parking the displaced basket |
| Cancel/void | Required reason, sensitive cancellation approval, reversal record, repeat-void prevention |
| Returns/refunds | Quantity limits, partial/repeated refunds, original-tender caps, cash override, zero-value returns, loyalty reversal |
| Receipts | Print preview, history reprint, email/SMS validation and simulation, no receipt |
| Thermal printer settings | Saved 58/80 mm width, font/margin validation, editable text escaping, receipt-only print media, generated PDFs |
| Cash drawer | Reason, manager approval, simulated open/close, audit events |
| Manager control | Incorrect PIN, three-attempt lock, 30-second unlock, approved actions |
| History/audit/help/order type | History reload, reprint without another sale, audit filtering, help content, persistent dine-in selection |
| Data recovery | Invalid JSON/schema backup and recovery, blocked-storage warning, malformed payments rejected, render error boundary |
| Layout | 1280×720, 1366×768, 1920×1080; no page overflow; Pay remains visible |

## Fixed during the audit

- Damaged saved data could reach rendering without validation. Added schema checks, a recovery backup and a persistent warning.
- Loyalty rewards could be reused after parking a sale and spending the points elsewhere. Checkout now checks the current balance and full eligible reward value.
- Voids/refunds did not reverse earned points or restore a fully returned reward. Added cumulative loyalty reversal.
- Cola pairs on separate noted/discounted lines missed the promotion. Pair counting now spans the product's basket lines.
- Dessert coupons spread their discount over unrelated products. The discount now stays on dessert lines.
- Line allocation could leave inconsistent rounding. Added largest-remainder allocation and tax-rate group rounding; the standard loyalty example now totals exactly 42,900 IQD.
- Completed receipts recalculated mutable pricing. New transactions retain pricing snapshots; legacy refund values are capped to the recorded transaction total.
- Malformed/repeated refund actions could throw in the reducer. They now fail safely; free-sale returns track quantities without creating a payment.
- Cash refund overrides could leave incorrect original-payment capacity. Earlier returned amounts now consume the original tender capacity.
- Adding product tiles could exceed the quantity editor's 999 limit. Both entry points now enforce the same limit.
- Search was restricted to the selected category; empty Enter could add a product. Search is global and empty Enter does nothing.
- Arabic numeric input, duplicate phone numbers and shared customer/points fields caused avoidable input failures. Added digit/phone normalization, duplicate checks and separate fields.
- Audit search did not filter events. It now searches action, reason, cashier and manager.
- History reprints displayed a new-payment success heading. They now use a receipt heading.

## Before the client meeting

1. Keep Docker Desktop running. Open the app in Chrome or Edge and refresh any tab loaded before the update.
2. Use one active sales tab. This is a single-browser demo, not a multi-terminal shared database.
3. To start from the sample basket, use the cashier menu → «إعادة بيانات التجربة» → confirm → demo PIN `2468`. This resets that browser's demo sales; only do it when those sales are disposable. The automated checks did not reset the user's browser data.
4. Sample basket total: 48,400 IQD. `WELCOME10` gives 43,560 IQD. Customer card `200001` has 650 points; redeeming 500 points on the original basket gives 42,900 IQD.
5. Use «محاكاة موافقة الدفع» for card/contactless. Do not enter real card data. Email/SMS and drawer actions remain simulations.
6. For a physical thermal receipt, install and test the Windows printer driver first, select matching 58/80 mm paper, 100% scale, no browser margins and no browser headers/footers. Printer/cutter output still requires a test on the actual device.

## Re-run verification

From `pos`, with Docker running:

```sh
npm run typecheck
npm test
npm run test:e2e -- --repeat-each=2
npm run test:sites
```

Browser tests use fresh profiles and do not access the user's normal browser storage. First-time test setup requires `npm ci` and `npx playwright install chromium`.

## Evidence files

- `qa/client-demo-1280.png`, `qa/client-demo-1366.png`, `qa/client-demo-1920.png`
- `qa/client-demo-printer.png`
- `qa/thermal-test-58.pdf`, `qa/thermal-test-80.pdf`
- `src/demo-audit.test.ts`, `e2e/demo-audit.spec.ts`

The browser print-request test replaces the physical print call with a test marker; PDF generation separately verifies print-only CSS. Neither proves a physical printer received paper. No real card processor, email/SMS service, printer, scanner or drawer was connected during this audit.
