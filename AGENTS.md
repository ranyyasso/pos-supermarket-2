# Prototype Instructions

Checkout action typography decision (2026-09-19): Use the same 16 px label size for the secondary basket actions (`خصم` and `تقسيم`) as the primary `الدفع` action. Preserve their existing dimensions, colors, and states.

Simplicity preference (2026-09-15): Outside the sale screen, prioritize concise task-focused UI. Remove nonessential descriptions, repeated information and decorative clutter; reveal advanced or infrequent options only when needed. Preserve functional labels, validation, approvals and relevant demo/hardware warnings. The user approved implementing the recommendations in `qa/simplicity-audit/report.html`. Keep the sale screen unchanged.

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

The `الإعدادات والإدارة` rail control opens Products directly in a single management workspace, with stable right-side navigation for Products, Inventory, Reports, Audit log, and Settings. Transactions are a separate workspace with Sales and Returns views. New-item registration belongs under Products and returns there on save/cancel; registration launched by a scanner returns to the sale. Settings group printer/drawer, store details, and receipt appearance. Keep demo reset under protected demo maintenance inside Settings. Guard unsaved product, receiving, and printer edits before navigation.

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

Navigation decision (2026-09-15): The user approved implementing the audit in `qa/navigation-audit/report.html`. Keep navigation shallow, give each task one clear home, and make return labels match their destination. Rail order: Search, Transactions, Returns shortcut, Drawer, Printer, Management, Help, then empty cells. Product and inventory management need name/barcode search and useful filters. Receiving uses separate supplier and delivery-reference fields.

Product workflow decision (2026-09-15): Implement barcode-driven receiving with delivery purchase cost, supplier and reference; unknown receiving barcodes open registration and return to the same delivery. Unknown sale barcodes offer explicit save-and-add after manager approval. Keep stock quantity and sale quantity separate. Generate unique internal barcodes only for items without manufacturer codes, and support 1–100 label copies. Reports support date ranges, sales, refunds, product profitability, receiving and stock movements with CSV. Snapshot unit costs and completion/refund timestamps for new transactions; exclude unknown historical costs from estimated profit with a visible explanation. Receiving uses the latest recorded delivery unit cost for subsequent sales; it is not FIFO or weighted-average costing.

Product color decision (2026-09-15): Product cards use the exact background color of their own category button, including mixed favorites and search results. Use one shared category palette for both surfaces; retain name-only cards and the existing layout.

Receiving form decision (2026-09-15): Keep receiving concise with an inline barcode search, full-width product selector, equal paired cost/quantity and supplier/reference fields, and a separate confirmation footer. Preserve validation, manager approval and unsaved-delivery protection.

Registration simplicity decision (2026-09-15): Show barcode, name, category, selling price and purchase cost first. Keep unit, tax, opening stock, low-stock threshold, expiry and supplier under additional details; default to pieces and omit opening stock during receiving. Focus the name for prefilled barcodes. Use one primary save action, save-and-add for sale registration, preserving manager approval and validation.

Input and back-button decision (2026-09-15): Use soft blue-grey #DCE5EF for input, select and textarea values throughout the app, with #8795A6 placeholders. All modal/workspace back buttons are text-only with consistent sizing and styling; preserve destination-specific return labels and existing navigation/protection behavior.

Database implementation decision (2026-09-15): PostgreSQL/Supabase foundation is in supabase/migrations, with local project pos_supermarket_2 on ports 55321–55324. Keep the saved browser demo active until the parity gates in supabase/README.md are implemented and verified; do not silently route existing financial flows to the basic checkout RPC. Preserve legacy IDs and explicitly simulated payments. Run database integrity/concurrency and Auth/RLS checks for database changes.

Payment simplicity decision (2026-09-15): Payment is cash-only. Center the amount entry and keypad, remove payment-method choices, split payments, quick cash shortcuts and payment-flow wording. The single primary action is text-only دفع.

Numeric typography decision (2026-09-15): Render every displayed numeric value with Latin digits, including prices, quantities, dates, identifiers, validation text and input values. Keep Arabic labels and the Arabic currency suffix.

Wholesale pricing decision (2026-09-15): The `مفرد` and `جملة` sale modes must immediately recalculate every basket line and total. Preserve the compatible `takeaway` and `dinein` service values; the wholesale mode applies a 10% trade rate.

Settings navigation decision (2026-09-15): Settings is a dedicated icon-only black rail action that opens directly. Do not include Settings in the management workspace navigation.

Sale basket simplicity decision (2026-09-15): Hide the customer and loyalty control from the sale basket.

Catalogue actions decision (2026-09-15): Place the four icon-only catalogue actions (price check, coupons, park and recall) in the catalogue top bar with the category stripe; do not place them at the bottom of the catalogue.

Empty basket decision (2026-09-15): Keep the basket panel open after its final item is removed. Show its empty state and disabled checkout controls in the same fixed basket layout.

Receipt simplicity and alignment decision (2026-09-17): Receipt selection offers printing or no receipt only; omit delivery prompt, email/SMS choices and fields, and the change summary. Thermal print documents use the configured paper width and center the paper in browser print preview.

Split payment decision (2026-09-17): Restore the text-only `تقسيم` control beside `خصم`. It opens the simplified cash payment flow and permits multiple cash installments until the full balance is paid; do not restore separate card or contactless controls.

Store configuration decision (2026-09-17): Replace the blanket wholesale discount with optional per-product wholesale prices and minimum quantities, hidden until the store enables wholesale. Define and enforce discount-combination rules with itemized saving reasons. Hard-coded offers are demo-only; store offers must be explicitly configured and activated. Use المبيعات المعلقة consistently with a saved-sale count and no customer search. The بدء استرجاع shortcut opens اختر فاتورة للاسترجاع; completed refunds remain in Returns. Merge settings into Hardware / Store / Receipt, with the printer shortcut opening Hardware. Keep loyalty disabled and omit demo PINs, sample coupons and simulated-hardware instructions from production Help. These decisions supersede earlier conflicting instructions.

Discount-combination implementation (2026-09-17): Use one saving source per sale: wholesale mode, a coupon, manual discounts, or the largest eligible automatic offer. Basket and item manual discounts cannot combine. Explicit discounts suppress automatic offers. New sales do not earn or redeem loyalty; historical reversals retain their recorded behavior. Store settings contain optional wholesale rules and explicit offer configuration/activation. Demo mode is retained by default for this client prototype; disabling it removes demo offers and demo Help content without enabling real financial operations.

Receiving workspace decision (2026-09-17): Remove the Stock status and Stock movements views from the Inventory/Receiving workspace. Show the receiving form directly with no three-button view switcher and no separate receiving button. Preserve receiving validation, manager approval, unsaved-delivery protection, registration return flow, and persisted inventory movements/reporting.

Receiving simplification and navigation decision (2026-09-17): Remove the receiving product dropdown, supplier and delivery-reference inputs. Select products by barcode only, show the matched product for confirmation, and use a category selector backed by categories registered under Settings > Store. New receiving registrations inherit the selected category. Use labels باركود and سعر القطعة and center تأكيد الاستلام. Supplier is optional for new receipts; automatically generate an internal receiving reference while preserving historical supplier/reference data. Remove سجل العمليات from management navigation while retaining persisted audit records.
Product editing decision (2026-09-17): Every product row, including the built-in catalogue, has a visible تعديل button. Allow editing barcode, name, category, selling price, purchase cost, stock quantity and additional product details. Preserve product IDs, duplicate-barcode validation, manager approval and unsaved-edit protection. Persist built-in edits across reloads and record stock changes as inventory adjustments.

Product form simplicity decision (2026-09-17): Remove tax and low-stock threshold fields from product registration and editing. Preserve stored values when editing existing products.
Basket layout correction (2026-09-17): Use a flexible column so hidden wholesale controls do not shift the scrolling item list or stretch checkout. Keep checkout anchored at the bottom of the basket.
Suspended sales decision (2026-09-17): Add a separate delete button to each suspended sale. Confirm the selected deletion, persist it, update the count, and leave the active basket and inventory unchanged.
Suspended-sales button decision (2026-09-17): Keep the catalogue suspended-sales button icon-only without a number badge or count in its label. Keep the count inside the suspended-sales dialog.
Catalogue footer decision (2026-09-17): Remove the displayed product count and move the four catalogue action buttons below the product area, with a horizontal separator. This supersedes the earlier top-bar placement.
Favorites decision (2026-09-17): Every product management row has an icon-only star toggle. Filled stars are favorites. Persist selections and show all selected available products in the Favorites category; keep global search independent. Preserve the initial 15 favorites until the user changes them.
Unified settings decision (2026-09-17): One Settings rail entry opens all configuration. Remove the duplicate printer rail shortcut. Hardware, Store and Receipt tabs occupy a right-side settings panel; include printer/drawer, store details, categories, wholesale, offers/demo maintenance and receipt appearance in this workspace. Preserve drafts and exit protection.
Settings edge alignment decision (2026-09-17): Settings fills the workspace width so its navigation panel sits flush against the right edge. Remove the hardware-status sentence beneath the paper width in the status card.
Transaction tab decision (2026-09-17): Remove the Returns navigation tab from the transaction workspace. Preserve refund operations, saved refund records and refund reports.
Action toolbar decision (2026-09-17): Move every black-rail action into the bottom catalogue toolbar with the existing four controls. Remove the black action column and its empty cells, retaining scanner focus and accessible icon labels. Wrap toolbar controls on narrow screens.
Basket header actions decision (2026-09-17): Place the icon-only park and suspended-sales recall controls on the left side of the basket header, beside the basket name. Remove these two controls from the catalogue footer.
Basket heading decision (2026-09-17): Remove the visible sale number from the basket header, use a clear larger السلة heading, and add a subtle separator line beneath the header. Keep park/recall actions on its left.
Suspended-sale simplicity decision (2026-09-17): Hold and recall dialogs use a theme-matched square X close button. Remove manual naming from hold; identify suspended sales by first product name, item count and total, with search by number or product name.
Basket quantity stripe decision (2026-09-17): Place each basket row color stripe immediately to the left of the quantity, between the quantity and product name in RTL.
Suspended list simplicity decision (2026-09-17): Remove the suspended-sales count and search field from the recall dialog. Show all saved sale rows directly with their delete controls.
Price-check simplicity decision (2026-09-17): Omit the explanatory sentence saying price checks do not add items to the basket; preserve the read-only price-check behavior.
Scanner decision (2026-09-17): Remove the visible search action button. Keep an invisible scanner input and automatic keyboard-wedge capture on the active sale screen; scanning requires no input selection or click, and modal text entry stays isolated.
Drawer reasons decision (2026-09-17): Remove the initial drawer simulation sentence. Choose an opening reason from a dropdown configured under Settings → Devices, with one reason per line and persistence through Save Settings. Preserve manager approval, audit logging and simulated drawer behavior.
Offers shortcut decision (2026-09-17): Remove the offers/coupons toolbar button and the explanatory coupon-combination sentence. Preserve configured offer calculation and discount validation.
Transaction simplicity decision (2026-09-17): Remove the remaining Sales tab button; open the transaction list directly with its receipt-number search.

Back-control appearance decision (2026-09-17): All app back and dismiss controls use the theme-matched square X icon button. Preserve destination-specific accessible names, navigation behavior and unsaved-change protection; this supersedes text-only back-button styling.

Toolbar consistency decision (2026-09-17): All bottom POS toolbar icon buttons share the price-check button’s bright icon color, dark background, border, corner radius and hover/pressed styling.

Cash-drawer spacing decision (2026-09-17): Keep the drawer dialog compact with no extra field margins, 8px label-to-select spacing and 20px between the reason field and action.

Settings organization decision (2026-09-17): Reserve the sidebar grid for the outer settings workspace. Inner category, wholesale and offer forms stack vertically with aligned responsive fields, clear bordered disclosure sections, consistent spacing and local save actions. Global settings actions follow content without covering fields.

Unsaved changes decision (2026-09-17): Ask حفظ التغييرات؟ in a compact modal with نعم / لا. Yes runs existing validated save and approval workflows before navigation; No discards and leaves; X cancels navigation and preserves the draft.

Settings consistency decision (2026-09-17): Apply the approved Store settings organization to Hardware and Receipt: distinct bordered groups for printer and drawer, separate advanced-option cards, consistent field spacing, and setup guidance before the shared action footer.

Category controls decision (2026-09-17): Show an explicit add action and a remove icon for categories. Prevent deleting categories still assigned to products. Limit new category names to 24 characters with a visible Latin-digit counter.

Category capacity decision (2026-09-17): Allow at most 13 regular categories plus the separate Favorites slot (14 total). Exclude Favorites from category management and the 13-category count; disable additions at capacity and enforce the limit in persistence without deleting existing saved categories.

Store settings simplification (2026-09-17): Remove the Wholesale disclosure and configuration controls from Store settings. Preserve existing stored pricing rules and transaction compatibility.

Settings tabs decision (2026-09-18): Remove the Receipt sidebar tab. Move receipt footer and store logo into Store details and keep receipt appearance options under Store; preserve saved values, preview and unsaved-change protection.

Receipt actions decision (2026-09-19): Remove the thermal-printer settings shortcut from the receipt dialog. Label its primary print action طباعة while preserving the enabled-printer requirement and existing preview/print flow.

Category typography decision (2026-09-19): Use bold 700-weight text for all sale category names, including Favorites, preserving centered labels and existing button sizing.

Suspended-sale deletion decision (2026-09-19): Delete a suspended sale immediately from its delete button without a confirmation dialog. This supersedes the earlier confirmation requirement.

Immediate suspension decision (2026-09-19): The basket suspend button saves immediately without a hold dialog, retaining automatic first-product naming and saved item count/total.

Discount dialog simplicity (2026-09-19): Remove the explanatory paragraph about manager approval and discount combinations from the discount dialog; preserve the underlying validation and approval rules.

Immediate recall decision (2026-09-19): Recall a suspended sale immediately without confirmation, preserving the automatic suspension of a populated current basket.

Numeric stepper decision (2026-09-19): Replace native number-input arrows throughout the app with a shared touch-sized minus/value/plus control, retaining typing, limits and step precision. Remove the refund instruction paragraph.

Refund toolbar decision (2026-09-19): Remove the separate Transactions toolbar button. Use the clock-with-circular-arrow History icon for the remaining Start Refund action, preserving its receipt-selection flow.

Refund invoice list decision (2026-09-19): Receipt-number search opens a compact numeric keypad modal. Display saved invoices in a theme-matched RTL table with invoice, status, payment method, amount and refund action columns; preserve eligibility and existing transaction actions. No tests requested for this change.

Receipt search decision (2026-09-19): Hide the receipt-number keypad popup for now; keep direct numeric search entry and the invoice table. This supersedes the keypad-opening behavior.

Refund reasons decision (2026-09-19): Refunds use a required dropdown backed by saved reasons configured under Settings > Store > أسباب الاسترجاع, one reason per line. Remove the cash-conversion checkbox and keep refunds allocated to original payment methods with existing manager approval.

Post-payment printing decision (2026-09-19): Show only طباعة and بدون طباعة buttons after payment. Print directly invokes the PC browser print dialog using the thermal receipt document, without app preview or completion modals; no-print returns to the sale. Preserve printer-enabled gating, original receipt data and simulated drawer audit. Browser print requests do not confirm physical output.

Theme decision (2026-09-19): Preserve the current palette as the default Dark theme and provide a soft milky Light theme in Settings. Persist the choice through Save Settings, retain unsaved-change protection, and apply it across sale, management and dialogs while keeping category colors and printed receipts intact.

Settings organization and autosave decision (2026-09-19): Use direct Settings tabs for Store, Categories, Hardware, Receipt, Offers, and Appearance/Demo. All fields in the selected tab stay expanded with no nested disclosures. Save valid settings edits automatically without Save buttons; keep explicit category add/remove actions, protected manager approval for offers/demo/category operations, validation, storage failure feedback and draft recovery. This supersedes the earlier receipt-tab removal and manual settings-save decisions.

Approval removal decision (2026-09-19): Remove manager PIN approval throughout the app; execute requested operations directly with existing validation, persistence, audit records and relevant confirmations. Do not attribute these operations to a manager. Remove the offer activation checkbox; new offers are active when saved, preserving existing offers' stored activation state.

Invoice view decision (2026-09-19): Add عرض الفاتورة beside استرجاع in the invoice table. Open saved receipt details with a printer-enabled طباعة action that requests browser printing directly. Closing returns to the invoice list with its search preserved; viewing or reprinting does not change stock or trigger a drawer pulse.

Product pagination decision (2026-09-19): Use react-paginate with RTL page numbers and left/right arrows in product management. Compute page capacity from available viewport height using touch-sized rows and room for the footer; reset to page one on search/filter changes. Keep item actions and theme colors.

Product list columns decision (2026-09-19): Product management uses columns ordered name, price, stock quantity, stock/availability status, barcode, then existing actions. Preserve current text sizes, use available workspace width and adaptive pagination for the 15-inch display; wrap long content and actions rather than reducing type size.

Stock status colors decision (2026-09-19): Product table stock status has three one-word Arabic badges: متوفر (green), منخفض (yellow, existing low-stock threshold), نافد (red, zero stock). Keep status text readable in both themes.

Product types decision (2026-09-19): Split management into Barcode and Manual pages. Both track stock. Barcode products have no favorites or label-generation action; manual products have favorites and an add-item action and do not require barcode entry. Existing built-in POS buttons default to manual while registered products default to barcode, preserving legacy IDs/codes and stock. Only manual products appear as POS category buttons; barcode search remains available. Remove label buttons from product management.

UI-only database decision (2026-09-19): Remove the unused Supabase/PostgreSQL foundation, client, database scripts/tests and dependencies. Keep browser demo storage and existing data for UI design. The user will design two separate database tables later, one for manual products and one for barcode products; do not add a database or schema now. POS category buttons use manual products; barcode/scale lookup and barcode receiving use only barcode products. This supersedes earlier database-foundation instructions.

Supabase migration handoff decision (2026-09-19): Remove built-in mock products, prefilled sale/customer data and default favorites. Store schema-only, sequentially numbered SQL files under `supabase/migrations/`, beginning with `0001_create_product_tables.sql`. Do not run, commit or push migrations; report that the file is ready for the user to copy and paste into Supabase Cloud. Cloud connection requires the project URL, anonymous/publishable key, browser-safe RLS policies and client integration.

Supabase Cloud connection decision (2026-09-19): The frontend is deployed from GitHub through Cloudflare and uses Supabase project `ilvztkvqggidnnggqnof`. Keep URL/key values in local and Cloudflare build environment variables, never the PostgreSQL password in browser code. With Auth not yet implemented, migration `0002_anonymous_product_access.sql` provides temporary anonymous CRUD for product tables only. Do not run, commit, push or deploy on the user's behalf; provide numbered migrations for manual copy/paste.

Product form modal decision (2026-09-19): Add/edit product forms open centered modal dialogs, with distinct Manual and Barcode titles/fields rather than full management workspaces. Keep draft protection and return to the originating page. Both product lists show the existing stable ID in an ID column. UI/demo only; no database work.

Modal origin decision (2026-09-19): Popups retain their originating screen behind them and close back to that origin, preserving selected tabs and filters. Track nested popup origins consistently across the app. Preserve unsaved-edit protection and protected payment/receipt dismissal behavior; payment completion remains a deliberate flow transition.

Product ID visibility decision (2026-09-19): Remove the visible ID column from both manual and barcode product lists. Preserve internal identifiers. This supersedes the earlier visible-ID decision.

Management sidebar decision (2026-09-19): Remove the المخزون والاستلام navigation entry from the management sidebar. Keep product stock data intact.

Basket quantity separator decision (2026-09-19): Replace the colored stripe between basket quantity and product name with a neutral multiplication sign × on every basket row.

Mixed-unit selling decision (2026-09-19): Use per-item selling options inside the expanded basket row with a square expand button and large theme-matched controls. Remove its item-discount button and the whole-sale single/wholesale switch. Product forms configure base unit (piece, kg, g, liter, ml), optional pack size/price/barcode, and optional automatic wholesale minimum/unit price. Packs count in whole packs and deduct their snapshotted piece count; measures accept up to 3 decimal places. Wholesale applies automatically to qualifying loose units and does not stack with explicit discounts/coupons. Pack price is independent. Preserve unit/pack snapshots through saved sales, receipts, refunds and reports. Keep historical sale-mode compatibility and simulated browser-only financial flows.

Basket row interaction decision (2026-09-19): Remove the multiplication separator and separate expand arrow. Tapping the product row, including quantity, name, price and whitespace, toggles selling options. The remove button only deletes and does not toggle options.

Unsaved navigation simplification (2026-09-19): Remove the حفظ التغييرات؟ yes/no confirmation for in-app navigation and form dismissal. Close/cancel returns directly to the originating screen without submitting the form; explicit save actions and existing settings autosave remain. Supersedes the earlier in-app unsaved confirmation requirement.

Expanded product form decision (2026-09-19): Keep pack selling, wholesale and additional product fields expanded in bordered sections in the add/edit modal. Use a compact three-column desktop form and shorter inputs/spacing without reducing text sizes; adapt to smaller screens with scrolling as needed.

Basket wholesale choice (2026-09-19): Add a per-line جملة checkbox using the saved product wholesale unit price. An explicit checkbox selection overrides automatic quantity qualification; deselecting uses retail. Disable it when no valid wholesale price is configured and retain discount-combination validation. Preserve purchase cost, retail price and wholesale price as separate product values.

Wholesale toggle appearance (2026-09-19): Use a square 56px جملة button with aria-pressed instead of the checkbox. Active state is green; retain wholesale price validation and disabled state when unconfigured.

Product simplification (2026-09-19): Remove pack-sale and wholesale configuration sections and their basket controls. Move stock quantity to the main product fields in place of the category selector; remove supplier entry. Preserve stored historical values and transaction compatibility.

Barcode entry simplification (2026-09-19): Remove the توليد باركود داخلي button from product forms; retain direct barcode entry.

Product stock form decision (2026-09-19): Remove unit selection and unit suffixes from product price labels; new products default to pieces. Replace the selector with الحد الأدنى للمخزون using a whole-number stepper; save it as minStock for low-stock status. Preserve legacy stored units without silently converting historical quantities.

Barcode list filtering decision (2026-09-19): Show category filtering only for manual products. Barcode product lists omit and ignore category filtering, including any selection retained from the manual tab.

Product add button label (2026-09-19): Both barcode and manual product list add buttons say only إضافة.

Initial stock input (2026-09-19): Start new-product initial stock empty rather than prefilled with 0; retain existing stock values when editing.
Required product fields (2026-09-19): Initial/current stock and purchase price are required in manual and barcode product forms. Mark both with an asterisk and reject blank values on save; explicitly entered zero remains valid.

Manual category and minimum stock decision (2026-09-19): Restore category selection in manual product add/edit forms only. Minimum stock is required for both product types, defaults to 1, and accepts whole numbers from 1 to 999999. Existing lower thresholds are shown as 1 when editing and saved only with the form.

Refund invoice selector decision (2026-09-19): Show the invoice table for starting a refund in a centered modal, with a viewport-aware maximum number of rows and RTL pagination controls.

Refund selector sizing decision (2026-09-19): Use a wider, taller refund invoice selector so the complete table and action column fit without horizontal clipping on the primary POS display.

Expiry decision (2026-09-19): Remove expiry dates from all product UI and workflows. Retain any legacy saved expiry data only for backward compatibility; do not expose or modify it.

Price-check focus decision (2026-09-19): Opening the price-check modal automatically focuses its product/barcode input and selects any existing value so scanner input or typing can replace it immediately.

Price-check add decision (2026-09-19): Every price-check match includes a clear green `إضافة للسلة` button. It adds the matched product and closes the price-check modal in one tap.

Price-check single-step decision (2026-09-19): Remove the separate product-detail result step from price check. Keep matches, prices and the green add-to-basket action together in the initial price-check modal.

Price-check scrollbar decision (2026-09-19): Give the scrollable price-check result list a wide, high-contrast scrollbar thumb that can be grabbed comfortably with a finger.

Price-check scrollbar placement decision (2026-09-19): Place the price-check result list's touch scrollbar on the right edge while retaining RTL content alignment.

Payment modal simplicity decision (2026-09-19): Remove the visual note stating that payment is simulated; retain the simulated payment behavior and validation.

Payment keypad and method decision (2026-09-19): Replace the keypad's clear key with `000`; backspace remains available. Payment offers two prominent choices, نقداً and بطاقة. Cash retains tendered amount and change handling; card records the entered exact amount with no change.

Refund invoice columns decision (2026-09-19): Remove the Status column from the invoice table; keep invoice, payment method, amount and actions.

Manual basket item decision (2026-09-19): Replace the split-payment shortcut beside Discount with a `صنف يدوي` action. It opens a compact touch numeric keypad for a one-off amount plus an optional item name, adds the line to the basket, and does not create a saved product or change inventory.

Toolbar order decision (2026-09-19): Place Price Check immediately to the left of Reports in the bottom POS toolbar.

Database schema decision (2026-09-19): Use one supermarket/location/checkout and one Supabase Auth owner. Separate manual and barcode products; custom unit label, one price, cost, three-decimal stock, no wholesale/package/tax/expiry/supplier. Manual products use categories/favorites; barcode products use one barcode and no category. Use a global low-stock setting. Keep permanent anonymous sales with one cash/card method and six-digit receipts from 325100, line/basket percent or fixed discounts, manual-entry lines, suspended baskets, and partial reason-required stock-restoring refunds. Store settings except logos, derive reports, keep no stock/drawer/general audit history, use Baghdad time and online-only operation. SQL stays manual copy/paste and is never run, committed, pushed, or deployed by the agent.

Production data-source decision (2026-09-19): The application has no demo mode and must not load or save operational data in browser localStorage. Remove obsolete browser records and use Supabase as the only operational source. Do not silently start a demo session when cloud loading fails.
