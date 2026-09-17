# Navigation fixes — 2026-09-15

Implemented the approved navigation audit in the existing POS.

- Management opens Products directly, with one persistent RTL sidebar for Products, Inventory, Reports, Audit log and Settings.
- Transactions use an independent Sales/Returns workspace. Printer setup has a dedicated fifth rail shortcut and a direct Sale exit; receipt-origin printer setup returns to the receipt with an explicit label.
- Products have name/barcode search, category/status filters and compact rows. Registration/editing preserves its origin, returns to Products or Sale as appropriate, and guards unsaved changes.
- Inventory separates stock, movements and receiving. Stock is searchable and filterable; receiving requires separate supplier and delivery-reference fields and manager approval.
- Settings group printer/drawer, store identity and receipt appearance. Drafts are guarded on navigation and browser unload. Demo reset is inside protected maintenance in Settings.
- Reports show the date and one Sale exit; CSV export remains available.
- Existing product IDs, prices and saved storage schemas are preserved.

## Verification

- Unit suite: 45 passed.
- Isolated browser suite: 63 passed, including six new navigation regressions.
- TypeScript: passed.
- Production build: passed.
- Sites worker/packaging suite: 4 passed.
- Browser inspection: management sidebar and grouped printer settings inspected in the in-app preview; narrow settings screenshot inspected at 390 px. Browser tests also cover 683/800 px management panes and existing sale-screen breakpoints.
- Actual printer, cash-drawer hardware and payment-provider operation remain unverified; all financial operations remain simulated.

The original `report.html` and numbered screenshots are retained as pre-change audit evidence. Current narrow-screen captures are `../navigation-settings-390.png` and `../navigation-settings-683.png`.
