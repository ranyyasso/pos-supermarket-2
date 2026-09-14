# ميزان — Arabic RTL touch POS

A local, frontend-only restaurant POS prototype based on the supplied photograph. Fully mirrored Arabic layout, Iraqi dinar prices, pastel product tiles, dark basket, and touch controls. Built with React 19, TypeScript, Vite, Tailwind v4, Radix Dialog, Lucide, and self-hosted IBM Plex Sans Arabic.

## Open the app

http://127.0.0.1:18173

Docker Compose project: `mizan-pos`. Container: `mizan-pos-pos-1`. The port is bound only to localhost. Existing Docker services are not modified.

```powershell
& "$env:LOCALAPPDATA/Programs/DockerDesktop/resources/bin/docker.exe" compose up -d --build
```

Run from this `pos` folder. The Docker build runs TypeScript checks and unit tests before producing the nginx image. Data lives in the browser's localStorage, not in Docker, so restarting the container preserves the same browser's data. Different browsers have independent demo data.

## Implemented sections

1. **Catalog:** Arabic categories, product search, keyboard-wedge barcode scans, manual barcode entry, independent price checking, restriction badges.
2. **Basket:** add, increase/decrease, direct quantity editor and touch keypad, removal confirmation, notes, undo, takeaway/dine-in.
3. **Pricing:** integer IQD, item and basket percentage/fixed discounts, configurable product tax rates, automatic cola pair promotion, WELCOME10 and DESSERT5 coupons, itemized totals.
4. **Customers:** name/mobile/loyalty-card lookup, new customers, attachment/removal, points display, reward redemption, manager-approved points adjustments.
5. **Age verification:** accept, refuse, manager override, and audit events for restricted products.
6. **Payments:** cash tender and change; card/contactless approval, decline, timeout, cancellation simulations; split payments; partial-payment reload recovery; manager-approved reversal of simulated partial payments.
7. **Sale management:** park with note, searchable recall, cancellation with reason, manager-approved voids creating reversal records.
8. **Returns:** receipt lookup, quantity limits, proportional original-price refunds, original-method allocation, manager-approved cash override, refund receipts and repeat-refund protection.
9. **Receipts:** Arabic thermal print preview for sales and refunds, browser printing through Windows drivers, email/SMS simulations, no-receipt choice, email and Iraqi mobile validation, history reprint.
10. **Manager/drawer:** reusable PIN approval, three-attempt/30-second lock, reason for manual drawer opening, automatic cash drawer simulation, audit history and demo reset.

## Demo credentials and data

- Manager PIN: `2468` (demonstration only, not authentication).
- Mozzarella barcode: `100001`; cola barcode: `100010`.
- Customer loyalty card: `200001` (fictional Ahmad), `200002` (fictional Noor).
- `WELCOME10`: 10% eligible basket discount.
- `DESSERT5`: 5,000 IQD discount when dessert gross subtotal reaches 20,000 IQD.
- `COLA2`: automatic buy-two cola promotion; no coupon entry required.
- `EXPIRED`: demonstrates expired-coupon validation.
- Example mobile: `07701234567`.
- Default 10% tax and age 18 are editable demo catalog settings, not tax/legal rules.

## Code map

- `src/model.ts`: catalog, types, pricing/refund functions, persisted state and reducer.
- `src/App.tsx`: RTL shell, touch flows and dialog orchestration.
- `src/ReceiptPreview.tsx`: receipt view, using the same pricing calculation as checkout.
- `src/styles.css`: Tailwind v4 theme tokens, component styles and desktop/touch breakpoints.
- `src/model.test.ts`: financial/state invariant tests.
- `design-qa.md`: browser evidence and visual QA results.

The requested `tailwind-design-system` skill was installed from `wshobson/agents` and applied through CSS-first `@theme` tokens, reusable button variants/states, logical RTL spacing, and responsive grids.

## Verification

The client-demo audit passed 39 unit/regression tests, 36 browser scenarios repeated twice (72 passing runs), TypeScript, the production build and four packaging checks. See `CLIENT-DEMO-CHECKLIST.md` for coverage, fixes and the demo walkthrough.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Browser checks use isolated Chromium profiles. The app was visually checked at 1280×720, 1366×768, and 1920×1080. Basket and category regions scroll independently; payment controls stay fixed.

The Playwright suites are in `e2e/`. With Docker running, install Chromium (`npx playwright install chromium`) and run `npm run test:e2e`. Current screenshots and 58/80 mm print-test PDFs are in `qa/`.

## Prototype boundaries

Payments, email/SMS and cash drawer commands are simulations. Thermal printing uses the browser print dialog and a Windows-installed printer driver; it does not confirm physical output. There is no backend, payment provider, inventory service, production authentication, fiscalization or shared database. A keyboard-wedge scanner is supported, but no physical scanner or other POS hardware was available for verification. Clearing browser storage deletes that browser's demo data; the manager menu can restore the initial sample basket.

## Thermal printer setup

1. Install the printer's Windows driver and verify a Windows test page. USB and network printers work through that driver; Docker does not need direct USB access.
2. Open the cashier menu, then **إعدادات الطابعة الحرارية**. Choose 58 or 80 mm paper, inner margins, font size, store name, address and footer. Save the settings in this browser.
3. Choose **معاينة وطباعة اختبار**, then **طباعة / حفظ PDF** inside the receipt preview. Select your thermal printer, matching roll size, scale 100%, no browser margins, and no browser headers/footers. Set copies and cutter options in the printer driver if supported.
4. After checkout, use **معاينة وطباعة الإيصال**. Reprinting from history and refund receipts use the same settings. Opening a preview does not mean a print job succeeded.

The embedded preview avoids pop-ups and renders Arabic using the browser. Use Chrome or Edge if the Codex in-app browser does not show its native print dialog. Continuous roll length and pagination depend on the driver; CSS uses the driver's paper size and constrains receipt content to the selected width. Physical printing still needs testing on your exact printer. There is no silent printing, direct ESC/POS, IP/port connection or printer discovery.

`src/printing.ts` contains settings validation and safe receipt HTML generation; `src/PrinterSettings.tsx` contains the settings UI. The `no-ai-slop` wording review is recorded in `copy-review.md`.
