# Design QA — Arabic RTL POS

## Current client-demo audit

The 14 September 2026 full audit supersedes the earlier test/capture limitations below. All 39 unit tests and 36 isolated browser scenarios passed; repeating every browser scenario produced 72 successful runs. TypeScript, Docker build/health and four packaging checks passed. New screenshots at all three desktop sizes were captured successfully, including 1920×1080. Receipt-only PDFs were generated at 58 and 80 mm; physical hardware remains unverified. See `CLIENT-DEMO-CHECKLIST.md` for the complete evidence and fixes.

## Thermal printing update

Added saved 58/80 mm settings, margins, font size, store details, test receipt, sale reprint and refund print views. Seven new printing tests plus 14 existing tests pass, together with TypeScript and the Docker production build. Browser checks verified saved width after reload, both paper widths, Arabic test receipt, long-name wrapping and a saved sale reprint matching its recorded 83,600 IQD total. The browser console remained free of warnings/errors.

Replaced the pop-up preview with an embedded iframe after the in-app browser did not expose the pop-up. Its print action calls `window.print()` after fonts are ready. The in-app browser did not visibly show a native printer dialog; no physical job or PDF was submitted. Test physical output in Chrome/Edge with the user's printer driver. Printing is now a browser integration, not a simulated success; the app explicitly leaves physical completion unconfirmed. All other simulation boundaries below remain unchanged. Copy edits and the skills.sh source are recorded in `copy-review.md`.

## Result

Passed for the local desktop prototype at 1280×720 and 1366×768. No known blocking defects in the exercised flows. Wide-screen DOM geometry passed at 1920×1080, but its browser screenshot was rendered incorrectly by the capture surface; wide-screen visual verification remains a follow-up. This is not production certification.

## Reference and design decisions

Reference: the user's `1-Photo-1.jpg` attachment. Preserve its dark surfaces, pastel category/product colors, three-column product grid, large rectangular controls, and persistent basket/payment area. Mirror the composition for Arabic: categories right, catalog center, basket left. Use self-hosted IBM Plex Sans Arabic and Lucide vector icons. No decorative raster assets were needed.

The photograph includes perspective, glare, bezel and obstructing devices. Exact original pixels, fonts and component library cannot be recovered from it. Colors and proportions are approximations; the added search/customer controls and expanded sale workflows are intentional differences. The applied tailwind-design-system skill influenced semantic Tailwind v4 theme tokens, reusable component variants/states, RTL-aware spacing and responsive layout.

## Evidence

- `qa/desktop-1366.png`: primary verified screenshot.
- `qa/desktop-1280.png`: compact desktop screenshot; categories and basket scroll independently.
- `qa/reference-comparison.png`: supplied photo and implemented UI side by side.
- `qa/tile-comparison.png`: product color/grid detail comparison.
- `qa/viewports.json`: measured page overflow, tile visibility and Pay visibility at 1280×720, 1366×768 and 1920×1080. All 15 favorite tiles and Pay were within their regions.
- `qa/desktop-1920.png`: capture artifact, not trustworthy visual evidence; do not use for visual sign-off.

## Iteration

1. Reduced tile padding to keep all 15 favorites on compact desktops, while retaining touch-sized buttons.
2. Collapsed basket quantity/discount controls until a line is selected to improve receipt density.
3. Replaced native confirmation/prompt dialogs with in-app accessible dialogs after browser testing exposed a stalled native-dialog interaction.
4. Corrected manager discount approval preview to exclude restricted-item values.
5. Persisted partial payments and restored their payment dialog after reload.

## Verification performed

- TypeScript check, 14 Vitest tests and production Vite build passed; Docker build also runs those checks.
- Browser console: no warnings or errors on the final clean demo.
- Quantity changes and undo; barcode entry; independent price checking.
- Coupon and loyalty redemption totals; customer card lookup.
- Restricted item refusal/acceptance; manager PIN lock after three failed attempts and subsequent successful approval.
- Split cash/card payment, card decline and approval, contactless approval, partial-payment recovery after reload.
- Cash tender 10,000 IQD for an 8,800 IQD sale produced 1,200 IQD change.
- Park/recall; cancellation; manager-approved void with reversal record.
- Partial refund with original-price allocation and manager approval.
- Receipt selection and invalid/valid email and SMS validation, all simulated.
- Manual drawer reason, manager approval, open state and close confirmation, all simulated.
- Restored the original sample sale #553 for handoff.

## Remaining integration and testing boundaries

Physical scanner/printer/drawer and real payment/SMS/email services were not available or connected. No production backend, authorization or compliance integration is included. A complete screen-reader audit, physical touch-device testing and reliable wide-screen visual capture remain future checks. The standalone Playwright suite is supplied but was not executed independently in this session; equivalent core flows were exercised through the in-app browser.

## Responsive basket follow-up — 2026-09-14

This verification supersedes the earlier standalone-browser testing limitation above. The Docker build passed type checking and 39 unit tests; all 44 standalone Playwright scenarios passed against the rebuilt container. Eight new layout cases cover 1294×912, 1280×720, 1024×768, 1024×600, 900×650, 800×600, 683×512 and 390×844.

Removed the 1050px minimum shell width. Responsive columns keep the basket beside products where space permits; very small/short viewports use a vertically scrollable stacked layout. Basket items scroll independently of checkout. Tests check horizontal overflow, list height, checkout separation and reachability. Screenshots: `qa/basket-1024x768.png` and `qa/basket-800x600.png`. The actual 1294×912 user browser was refreshed and visually checked without resetting its saved basket.

Removed nonessential sale-screen descriptions, scanner slogans, static shift text and session footnotes. Functional labels and demo/hardware warnings remain. The responsive-design skill guided content-based breakpoints and independent scrolling; physical display inches cannot be determined from a browser viewport. Physical hardware and full accessibility testing remain outside this verification.
## Category/action rail comparison

- Source visual truth: `C:\Users\Rani\.codex\codex-remote-attachments\01a09fd3-a640-7b62-a0f0-3f8cb28b882f\AAF70BB1-76AA-4C21-9652-1D4D69210B70\1-Pasted-Image-1.jpg`
- Implementation screenshot: `C:\Users\Rani\Documents\ChatGPT\pos supermarket 2\qa\category-action-rail-1294x912.png`
- Viewport: 1294 × 912 CSS px, desktop, device scale factor 1.
- Source pixels: 452 × 955. Implementation pixels: 1294 × 912. The source is a narrow reference crop, so comparison used the rail region rather than pixel-scaling the full screen.
- State: Arabic RTL dark-theme POS, `المفضلة` category active, default sale populated.

### Full-view comparison evidence

The implementation keeps the existing POS composition while matching the source rail anatomy: a narrow black strip sits directly beside the colored category stack. The requested proportions are exact—125 × 50 px category cells and 50 × 50 px black cells—and the overall desktop rail is 175 px. The gold selection edge is rendered on the black cell corresponding to the active category.

### Focused region comparison evidence

The rail was inspected in the in-app browser and in the saved 1294 × 912 capture. Category text stays centered; the four moved actions use the existing Lucide icon family and contain no visible labels; remaining black cells continue the strip. Transactions, returns, drawer and help retain accessible names and working click behavior.

### Required fidelity surfaces

- Fonts and typography: Existing IBM Plex Sans Arabic family, weights and centered category labels preserved; no wrapping at 125 px.
- Spacing and layout rhythm: Exact requested 125/50 widths and 50 px row rhythm; no gap between paired columns.
- Colors and visual tokens: Existing pastel category tones and dark theme retained; black action strip and gold active edge match the reference hierarchy.
- Image quality and asset fidelity: The source contains no raster assets to reproduce. Standard UI symbols use the project’s existing icon library; no emoji, placeholders or custom SVG artwork were introduced.
- Copy and content: Existing Arabic category names remain unchanged. Moved actions are icon-only visually and preserve Arabic accessible labels.

### Comparison history

- Initial implementation: no P0/P1/P2 mismatch found in the focused rail comparison. The intentional deviation from the reference’s numeric cells is required by the user: those cells contain the four moved action icons instead.

### Findings

- No actionable P0, P1 or P2 findings.
- P3: On very narrow/mobile layouts the paired columns reflow into horizontal scroll rows to preserve touch targets and basket access.

### Primary interactions and runtime checks

- Active category marker follows the selected category row.
- Icon actions retain their original destinations; the Help action was opened successfully.
- The 1294 × 912 basket remained visible and reachable.
- Automated browser checks monitor runtime and console errors.

final result: passed
