# Thermal printer deployment

The POS prints a dedicated Arabic receipt document through the browser's standard print system. The web application does not have permission to select a Windows printer or confirm that paper physically exited the printer.

## Required Windows setup

1. Install the manufacturer's Windows driver for the exact printer model. Avoid a generic text-only driver when printing the Arabic HTML receipt.
2. Print a Windows test page before testing the POS.
3. In **Printing preferences**, create or select the correct 58 mm or 80 mm receipt-paper size. Disable duplex, set scaling to 100%, and enable the cutter if the driver supports it.
4. Make the thermal printer the Windows default if this checkout should use one-click or silent printing.
5. In the POS, open the cashier menu → **إعدادات الطابعة الحرارية**. Enable thermal printing, enter the Windows printer name, choose the matching paper width, save, and run **معاينة وطباعة اختبار**.
6. In the browser print dialog, choose that thermal printer, use the matching paper size, margins **None**, scale **100%**, and turn off browser headers and footers.

## Normal browser mode

This is the universal mode and works with Chrome or Edge plus a Windows-installed printer driver. Each print action opens the browser print dialog. The operator must confirm the selected printer and settings. Cancelling the dialog and successfully printing look identical to the webpage, because browsers do not expose print-job completion.

## Direct/silent mode

For a dedicated managed till, current Chrome Enterprise supports the `SilentPrintingEnabled` policy. When enabled, `window.print()` prints immediately to the operating system's default printer with its default options. Configure the thermal printer and its receipt paper as Windows defaults before enabling this policy. This is a device-administration task, not a webpage setting.

If printer selection, printer status, raw ESC/POS commands, or automatic drawer/cutter commands must be controlled by the web application, deploy a signed local print bridge such as QZ Tray. That integration requires software installation and certificate/signing decisions and must be tested with the exact printer model.

## Acceptance test

- Arabic text is readable and not printed as boxes or question marks.
- Receipt width matches the roll with no clipped right or left edge.
- Browser URL/date headers do not print.
- One sale receipt and one refund receipt print correctly.
- Long product names wrap without overlapping quantity or amount.
- The configured feed leaves enough paper below the footer for the cutter.
- Reprint produces one receipt only.
- Disabling thermal printing removes or disables every receipt print action.

Physical printer output remains unverified until these checks pass on the intended checkout computer and printer.
