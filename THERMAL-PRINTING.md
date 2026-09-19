# Thermal receipt printing

The POS generates an Arabic thermal receipt and opens the browser's standard print dialog. Docker does not connect directly to the printer.

## Setup

1. Install the manufacturer's Windows driver and print a Windows test page.
2. Configure the driver for the correct 58 mm or 80 mm roll, 100% scaling, and cutter settings if supported.
3. Enable thermal printing under POS Settings → Hardware and select the matching paper width.
4. In Chrome or Edge, choose the thermal printer, disable browser headers and footers, and use no browser margins.

Printing is available only when thermal printing is enabled in the POS. Each print action invokes the browser dialog directly. The web app cannot select a printer, inspect its status, or confirm that paper was produced.

For unattended printing, the checkout computer must be separately managed with an approved browser default-printer policy or local print bridge. That setup requires verification with the actual printer and cash drawer.

## Hardware acceptance check

- Arabic text prints correctly.
- Content fits the configured roll without clipping.
- Long product names wrap correctly.
- Browser headers and footers are absent.
- Sale, reprint, and refund receipts work.
- The configured feed and cutter behavior are suitable.

Physical printer and drawer behavior remain unverified until tested on the intended hardware.
