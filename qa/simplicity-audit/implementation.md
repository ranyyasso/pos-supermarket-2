# Simplification implementation — 2026-09-15

Implemented the approved review outside the primary sale screen.

- Products: removed demo badges, redundant counters and the policy paragraph; label copies now appear in label preview, with a 1–100 limit and no printable stale preview for invalid input.
- Registration: removed introductory paragraphs, marked required fields, kept cost/stock/tax visible, collapsed optional details, and corrected the narrow desktop workspace. Internal barcode generation appears only for an empty barcode.
- Inventory: removed repeated headings, duplicate stock quantities and selling-price subtext; shortened receiving actions. Receiving compares its full draft with its starting values, so automatic cost prefilling is clean and real edits are protected.
- Reports: removed the repeated date and low-stock panel, moved the void count to Sales details, hid empty payment/best-seller panels, and made report qualifications contextual. Required report types and CSV remain available.
- Printer settings: collapsed advanced adjustments, store/receipt details and setup guidance. Kept enable/disable, paper width, simulated drawer option, hardware-status warning and Save/Preview accessible.
- Print preview: one destination-labelled return control; optional print instructions; hidden receipt-preview scrollbar with scrolling preserved.
- History/audit/help/drawer: shorter titles and empty states; removed stale age-related help copy, collapsed demo reference codes and removed decorative drawer content. Drawer results explicitly describe simulation.
- Preserved manager approval, saved storage schemas, financial simulation, receipt protection and the sale screen's layout and controls.

## Validation

- 49 unit tests passed.
- 69 isolated browser regressions passed, including sale/return/void, receiving registration and recovery, printing, label-copy limits, draft guards, persistence and responsive layouts.
- TypeScript check passed.
- Production build passed.
- 4 Sites packaging tests passed; required output files were generated.
- In-app browser inspection: Products, registration and printer settings render correctly at 1280 × 720. Browser regression coverage includes narrow panes.

No physical printer or payment-provider verification was performed. The existing audit report and its screenshots remain a record of the pre-change UI.
