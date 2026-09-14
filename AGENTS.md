# Prototype Instructions

Product cards show only the centered product name: no stock, category, price, icons, promotion badges or plus symbol. Clamp names to two lines without overflow, keep equal card sizes, use two columns on phones and exactly three on tablet/desktop widths. The main checkout button says only `الدفع`, has no icon or amount, and its label is centered. Optimize the primary sale screen for a 15-inch touch display, with touch scrolling on every scrollable region. Keep the barcode search focused and ready for scanner input without a manual tap. Do not add cashier day-opening/day-closing controls or references. Avoid emoji throughout the POS UI.

No top header on the POS screen. Put only the cashier name/menu and current time at the bottom of the right category panel, below all navigation tabs/actions. Keep simulation warnings inside relevant payment/help flows.

Center category names inside their buttons. Do not show a selection arrow, stripe, or edge marker in category buttons.

Category buttons show names only, without numbers or icons, and the category rail has no heading/count. On the sale basket, omit the cancel-sale header control, column heading, per-item unit-price subtext, and the default subtotal/tax rows. Show line totals as numbers without a currency suffix; on the grand total only, render `د.ع.` smaller and grey. Label the two sale modes `مفرد` and `جملة` while preserving the compatible saved service values. Every populated basket row has an always-visible, theme-matched icon-only remove button on its far-left edge; it removes that line immediately, uses a touch-sized target, and retains a descriptive Arabic accessible name.

Adding an item to the basket must not display a confirmation toast. Remove the catalogue-footer undo control; use its arrow-style icon for the `استدعاء` button instead of a folder icon.

On tablet/desktop, the category rail is a two-column matrix inspired by the supplied reference: 125×50 px colored category buttons beside a 50×50 px black action-cell column. Move transactions, returns, cash drawer and help into icon-only action squares, keep their accessible names. Do not render a category selection/hover stripe on either column.

The black action column sits on the far-right RTL edge and contains fourteen 50 px rows on the primary 15-inch layout. Remove the cashier-name/time footer and expose the former cashier-menu actions directly as icon-only squares. Show up to thirteen categories per page and advance to the next category page when more categories exist.

Keep the fourteenth black action cell empty; place the category-page down arrow in the fourteenth 125×50 category cell instead. The first black cell is an icon-only product/barcode search control backed by the always-focused scanner input. Use zero border radius throughout both category-rail columns. The catalogue footer contains exactly four equal 50×50 icon-only controls: price check, coupons, park and recall. Do not show footer labels or counts. Discount and split-payment buttons retain their text but have no icons, and the active single/wholesale selector uses the neutral blue-grey theme rather than brown/gold.

For the touch POS, regular informational or navigation dialogs dismiss when the operator taps the backdrop. Keep payment-in-progress, receipt, and manager-approval dialogs protected against accidental backdrop dismissal. Hide visual scrollbars while preserving touch/pan scrolling in every scrollable POS region, and disable text selection and touch callouts across the POS interface.

Use a subtle 1 px blue-grey focus indicator with a 1 px offset across every input and interactive control; never use thick yellow/gold focus outlines in the POS.

Modal headers show their title only: never render a subtitle, store/terminal line, order summary, or approval text beneath the title. Keep essential warnings and validation in the relevant modal body.

Combine printer settings, daily reports, product management, inventory/receiving, and new-item registration behind one icon-only `الإعدادات والإدارة` rail control. The resulting management menu lists those five choices; leave the freed rail cells empty.

The fourteen category-rail rows use this exact ordered palette: `#DDC76F`, `#D17F8B`, `#C6C4C6`, `#86B7D5`, `#DFA07E`, `#D5BFA2`, `#A7CE7E`, `#D9AFC0`, `#72B9B0`, `#9FAED8`, `#BE9DCE`, `#8CCBC8`, `#E0AD8F`, `#B3A4D2`. Keep added placeholder category rows visually unlabeled and make all fourteen rows regular bordered category buttons; do not show a paging arrow.

Do not render a category selection/hover marker or stripe on the colored category buttons or the black action rail.

Place the black icon strip on the far right of the category rail for RTL. Move thermal-printer settings out of the cashier management dialog into a fifth icon-only black square; returning from those settings goes directly back to the sale screen.

The mock catalog is a kids-focused supermarket: snacks, breakfast foods, dairy, sweets, juices/water, baby care, stationery and daily care. No alcohol or age restrictions on these products. Keep existing IDs and mock prices stable so saved demo sales remain compatible. Unknown numeric barcode scans open a prefilled new-item registration form. Saving requires manager approval, rejects duplicate barcodes, and persists the product with category, unit, selling price, cost, supplier, opening stock, low-stock threshold, tax and optional expiry. Completed sales deduct stock, refunds and voids restore eligible quantities, receiving requires a supplier/reference and manager approval, and every inventory change records a persisted movement with its resulting balance. Variable-measure demo barcodes use a validated EAN-13 restricted prefix (20–29), a configured five-digit scale item code and a five-digit embedded price; display the derived weight and keep this local layout explicit rather than presenting it as a universal GS1 encoding. Product management can generate real scannable shelf labels through the enabled thermal-printer flow.

Keep the sale screen concise: no generic descriptions, scanner slogans, fake shift-time text or session footnotes. Preserve functional labels and demo/hardware warnings. The basket must remain reachable in smaller browser panes and scaled 15-inch POS displays; do not impose a fixed desktop minimum width. Use an independently scrolling basket list with totals/pay controls outside it.

The user requires a dependable client demo. Keep all financial operations explicitly simulated; preserve saved data, validate input and recovery paths, and run the unit and isolated browser regression suites before handing off changes. Receipt printing must be available only when thermal printing is enabled in printer settings. The browser-driver flow is the universal printing path; direct/silent output requires a managed Chrome default-printer policy or a separately approved local print bridge. Represent a printer-connected cash drawer as a simulated pulse triggered by the thermal receipt print request for a cash transaction, and distinguish browser configuration from verified hardware status. Do not claim physical printer or payment-provider verification without hardware evidence.

Daily reports derive only from saved browser transactions, refunds, product costs and live inventory. Exclude voided sales from revenue, subtract refunds from sales/payment/best-seller figures, label profit as an estimate before operating expenses, and keep CSV export available for the client demo.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
